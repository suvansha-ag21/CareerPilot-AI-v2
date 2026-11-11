import io
import re
import wave
from typing import Dict, List, Optional
from app.core.llm_provider import llm_client
from app.rag.vector_store import vector_store
from app.schemas.interview_schema import (
    CategoryStr,
    CriteriaScoresSchema,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    EvaluatedAnswerLLM,
    GeneratedQuestionLLM,
    InterviewSummaryLLM,
    NextQuestionPayload,
    SpeechMetricsSchema,
    StartInterviewQuestionRequest,
    StartInterviewQuestionResponse,
    SummarizeInterviewRequest,
    SummarizeInterviewResponse,
    TranscribeAudioResponse,
)

CATEGORY_TOPIC_FILTER: Dict[CategoryStr, Optional[str]] = {
    "DSA": "DSA",
    "JAVA": "Java",
    "PYTHON": "Python",
    "SQL": "SQL",
    "HR": "Full Stack & HR",
    "BEHAVIORAL": "Full Stack & HR",
    "FULL_STACK": None,
    "TECHNICAL": None,
    "PROJECT_BASED": None,
    "MIXED": None,
}


def compute_weighted_score(c: CriteriaScoresSchema) -> float:
    raw = (
        0.30 * c.technicalAccuracy
        + 0.25 * c.depthOfUnderstanding
        + 0.20 * c.completeness
        + 0.15 * c.clarityAndStructure
        + 0.10 * c.practicalExamples
    )
    return round(min(100.0, max(0.0, raw)), 1)


async def generate_opening_question(
    payload: StartInterviewQuestionRequest,
) -> StartInterviewQuestionResponse:
    subcats_str = ", ".join(payload.subcategories)
    kb_query = f"{payload.category} {subcats_str} {payload.difficulty} {payload.target_role} {payload.target_job_description or ''}"
    topic_filter = CATEGORY_TOPIC_FILTER.get(payload.category)
    rag_docs = vector_store.retrieve_cs_context(kb_query, topic_filter=topic_filter, top_k=4)

    resume_snippets = []
    if payload.resume_id:
        resume_snippets = vector_store.retrieve_resume_context(
            user_id=payload.user_id,
            resume_id=payload.resume_id,
            query_text=f"{payload.category} projects architecture backend frontend experience",
            top_k=3,
        )

    rag_block = "\n".join(f"[{d['topic']} - {d['subtopic']}] {d['content']}" for d in rag_docs)
    resume_block = "\n".join(resume_snippets) if resume_snippets else (payload.resume_summary or "")

    system_prompt = (
        "You are a Principal Engineering Interviewer conducting a structured, realistic mock interview. "
        "Ask one clear, rigorous question calibrated to the requested category and difficulty level, "
        "grounded strictly in real engineering concepts and the candidate's actual background."
    )
    user_prompt = (
        f"Category: {payload.category} | Difficulty: {payload.difficulty}\n"
        f"Focus Subcategories: {subcats_str or 'General Role Core'}\n"
        f"Target Role: {payload.target_role} ({payload.years_experience} yrs experience)\n"
        f"Candidate Skills: {', '.join(payload.skills_list[:20]) or 'General CS'}\n"
        f"Candidate Projects: {payload.projects_summary or 'None specified'}\n"
        f"Resume RAG Context:\n{resume_block[:1500] or 'No resume attached'}\n"
        f"Target JD Context:\n{(payload.target_job_description or '')[:800]}\n"
        f"CS Knowledge Base Reference:\n{rag_block}\n\n"
        "Generate Question 1 plus a concise high-bar reference model_answer and a 1-3 word topic_tag."
    )

    llm_q = await llm_client.generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_cls=GeneratedQuestionLLM,
    )

    return StartInterviewQuestionResponse(
        question=llm_q.question.strip(),
        topic_tag=llm_q.topic_tag.strip(),
        model_answer=llm_q.model_answer.strip(),
    )


async def evaluate_and_advance_interview(
    payload: EvaluateAnswerRequest,
) -> EvaluateAnswerResponse:
    topic_filter = CATEGORY_TOPIC_FILTER.get(payload.category)
    rag_docs = vector_store.retrieve_cs_context(
        f"{payload.current_topic_tag} {payload.current_question}",
        topic_filter=topic_filter,
        top_k=3,
    )
    rag_block = "\n".join(f"[{d['topic']} - {d['subtopic']}] {d['content']}" for d in rag_docs)

    resume_block = ""
    if payload.resume_id and payload.category in ("PROJECT_BASED", "FULL_STACK", "TECHNICAL"):
        snippets = vector_store.retrieve_resume_context(
            user_id=payload.user_id,
            resume_id=payload.resume_id,
            query_text=payload.current_topic_tag,
            top_k=2,
        )
        resume_block = "\n".join(snippets)

    covered_topics = [item.topic_tag for item in payload.previous_qa] + [payload.current_topic_tag]
    prior_history = "\n".join(
        f"Q({item.topic_tag}): {item.question}\nA: {(item.user_answer or '')[:300]} (Score: {item.score})"
        for item in payload.previous_qa[-4:]
    )

    need_next = payload.remaining_questions > 0
    subcats_note = f" focusing across selected topics [{', '.join(payload.subcategories)}]" if payload.subcategories else ""
    next_instruction = (
        f"There are {payload.remaining_questions} question(s) remaining. "
        "Decide `should_follow_up`: set `true` (and ask a targeted follow-up probe) ONLY if the candidate gave a partially right or vague answer (roughly 35-78 quality) where probing deeper makes sense AND current_is_follow_up is false. "
        f"Otherwise set `should_follow_up=false` and pick a fresh distinct subtopic in `{payload.category}`{subcats_note} avoiding already-covered topics: {', '.join(covered_topics)}. "
        "Populate `next_question`, `next_topic_tag`, and `next_model_answer`."
        if need_next
        else "This was the final question (remaining_questions=0). Set should_follow_up=false and leave next_question/next_topic_tag/next_model_answer as null."
    )

    system_prompt = (
        "You are an objective, calibrated Technical Interview Grader. "
        "Grade the candidate strictly against the CS Knowledge Base reference and reference model answer. "
        "Weak, off-topic, or superficial 1-line answers must score low (0-35). Thorough, accurate, concrete answers score 80-95."
    )
    user_prompt = (
        f"Category: {payload.category} | Difficulty: {payload.difficulty} | Role: {payload.target_role}\n"
        f"Current Topic: {payload.current_topic_tag} | Was Follow-up: {payload.current_is_follow_up}\n"
        f"Question Asked:\n{payload.current_question}\n\n"
        f"Reference Model Answer:\n{payload.current_model_answer}\n\n"
        f"CS Knowledge Base Ground Truth:\n{rag_block}\n\n"
        f"Candidate Answer:\n{payload.user_answer}\n\n"
        f"Prior Conversation Context:\n{prior_history or 'Opening question'}\n"
        f"Resume Context: {(resume_block or payload.resume_summary or '')[:900]}\n\n"
        "Evaluate the candidate on all 5 numeric criteria (0-100): technicalAccuracy, depthOfUnderstanding, completeness, clarityAndStructure, practicalExamples. "
        "Provide crisp, direct feedback citing specific strengths or missing concepts.\n"
        f"{next_instruction}"
    )

    eval_out = await llm_client.generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_cls=EvaluatedAnswerLLM,
    )

    score = compute_weighted_score(eval_out.criteria_scores)

    next_payload: Optional[NextQuestionPayload] = None
    if need_next:
        q_text = (eval_out.next_question or "").strip()
        if not q_text:
            # Ensure next question is always supplied when questions remain
            fallback_q = await generate_opening_question(
                StartInterviewQuestionRequest(
                    user_id=payload.user_id,
                    category=payload.category,
                    difficulty=payload.difficulty,
                    target_role=payload.target_role,
                    subcategories=payload.subcategories,
                    resume_id=payload.resume_id,
                    resume_summary=payload.resume_summary,
                    target_job_description=payload.target_job_description,
                )
            )
            next_payload = NextQuestionPayload(
                question=fallback_q.question,
                topic_tag=fallback_q.topic_tag,
                model_answer=fallback_q.model_answer,
                is_follow_up=False,
            )
        else:
            next_payload = NextQuestionPayload(
                question=q_text,
                topic_tag=(eval_out.next_topic_tag or payload.current_topic_tag).strip(),
                model_answer=(
                    eval_out.next_model_answer or "Provide clear technical principles, trade-offs, and an applied example."
                ).strip(),
                is_follow_up=bool(eval_out.should_follow_up and not payload.current_is_follow_up),
            )

    return EvaluateAnswerResponse(
        score=score,
        criteria_scores=eval_out.criteria_scores,
        feedback=eval_out.feedback.strip(),
        next_question=next_payload,
    )


async def summarize_interview(
    payload: SummarizeInterviewRequest,
) -> SummarizeInterviewResponse:
    items = payload.answered_questions
    n = max(1, len(items))

    overall_score = round(sum(i.score for i in items) / n, 1)
    rubric_avg = CriteriaScoresSchema(
        technicalAccuracy=round(sum(i.criteria_scores.technicalAccuracy for i in items) / n, 1),
        depthOfUnderstanding=round(sum(i.criteria_scores.depthOfUnderstanding for i in items) / n, 1),
        completeness=round(sum(i.criteria_scores.completeness for i in items) / n, 1),
        clarityAndStructure=round(sum(i.criteria_scores.clarityAndStructure for i in items) / n, 1),
        practicalExamples=round(sum(i.criteria_scores.practicalExamples for i in items) / n, 1),
    )

    rag_topics = list(dict.fromkeys(i.topic_tag for i in items))
    weak_topics = list(dict.fromkeys(i.topic_tag for i in items if i.score < 70.0))

    transcript = "\n".join(
        f"- [{i.topic_tag}] Score {i.score}% | Q: {i.question[:140]} | Feedback: {i.feedback[:180]}"
        for i in items
    )

    system_prompt = (
        "You are an Engineering Hiring Committee Reviewer synthesizing a post-interview performance dossier. "
        "Base every observation strictly on the candidate's scored responses below."
    )
    user_prompt = (
        f"Category: {payload.category} | Difficulty: {payload.difficulty} | Target Role: {payload.target_role}\n"
        f"Overall Score: {overall_score}%\n"
        f"Weak Topics (<70%): {', '.join(weak_topics) or 'None'}\n"
        f"Question Transcript:\n{transcript}\n\n"
        "Return executive_summary (2-3 crisp sentences), 2-4 specific strengths, 2-4 areas_to_improve, and 2-4 concrete next_recommendations."
    )

    summary_llm = await llm_client.generate_structured(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_cls=InterviewSummaryLLM,
    )

    return SummarizeInterviewResponse(
        overall_score=overall_score,
        executive_summary=summary_llm.executive_summary.strip(),
        strengths=summary_llm.strengths,
        areas_to_improve=summary_llm.areas_to_improve,
        weak_topics=weak_topics,
        rubric_averages=rubric_avg,
        rag_topics_covered=rag_topics,
        next_recommendations=summary_llm.next_recommendations,
    )


FILLER_PATTERNS = [
    r"\bum\b",
    r"\buh\b",
    r"\berm\b",
    r"\blike\b",
    r"\byou know\b",
    r"\bbasically\b",
    r"\bactually\b",
    r"\bkind of\b",
    r"\bsort of\b",
]


def _extract_wav_duration_seconds(audio_bytes: bytes) -> Optional[float]:
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as w:
            rate = w.getframerate()
            frames = w.getnframes()
            if rate > 0 and frames > 0:
                return round(frames / float(rate), 2)
    except Exception:
        return None
    return None


async def transcribe_and_compute_metrics(
    audio_bytes: bytes,
    mime_type: str,
    filename: str,
    reported_duration_seconds: float,
) -> TranscribeAudioResponse:
    transcript = await llm_client.transcribe_audio_bytes(
        audio_bytes=audio_bytes, mime_type=mime_type, filename=filename
    )

    wav_dur = _extract_wav_duration_seconds(audio_bytes)
    effective_duration = wav_dur if wav_dur and wav_dur > 0 else max(reported_duration_seconds, 1.0)
    words = re.findall(r"[A-Za-z0-9']+", transcript)
    word_count = len(words)
    wpm = round((word_count / effective_duration) * 60.0, 1) if word_count > 0 else 0.0

    lowered = transcript.lower()
    detected_fillers: List[str] = []
    filler_count = 0
    for pat in FILLER_PATTERNS:
        matches = re.findall(pat, lowered)
        if matches:
            filler_count += len(matches)
            detected_fillers.append(matches[0])

    if word_count == 0:
        delivery_note = "No clear speech detected in recording. Please verify microphone input and speak close to the mic."
    elif wpm < 95:
        delivery_note = f"Measured {wpm} WPM (deliberate pace). Consider keeping phrasing slightly tighter to cover more technical depth."
    elif wpm <= 160:
        delivery_note = f"Strong conversational pace at {wpm} WPM."
    else:
        delivery_note = f"Rapid pace at {wpm} WPM. Pausing briefly between architectural points improves interviewer clarity."

    if filler_count >= 3:
        delivery_note += f" Detected {filler_count} filler words ({', '.join(detected_fillers[:3])})."

    return TranscribeAudioResponse(
        transcript=transcript,
        speech_metrics=SpeechMetricsSchema(
            durationSeconds=round(effective_duration, 1),
            wordCount=word_count,
            wordsPerMinute=wpm,
            fillerWordCount=filler_count,
            fillerWords=detected_fillers,
            deliveryFeedback=delivery_note,
        ),
    )

