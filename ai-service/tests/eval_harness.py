"""
Golden LLM-as-a-Judge calibration harness for CareerPilot AI.
Run manually when evaluating prompt/model changes:
  .venv\Scripts\python.exe -m tests.eval_harness
"""
import asyncio
from app.schemas.interview_schema import EvaluateAnswerRequest
from app.services.interview_engine import evaluate_and_advance_interview


async def run_calibration() -> None:
    base_q = "How does PostgreSQL MVCC work and how does it prevent readers from blocking writers?"
    model_ans = (
        "PostgreSQL MVCC (Multi-Version Concurrency Control) retains multiple tuple versions using "
        "xmin/xmax transaction IDs. Readers see a consistent snapshot without acquiring read locks "
        "that block concurrent writers, while VACUUM reclaims dead tuples."
    )

    weak_req = EvaluateAnswerRequest(
        user_id="eval-harness",
        category="TECHNICAL",
        difficulty="MEDIUM",
        target_role="Backend Developer",
        subcategories=["DBMS"],
        current_question=base_q,
        current_topic_tag="DBMS",
        current_model_answer=model_ans,
        current_is_follow_up=False,
        user_answer="It saves things faster in database tables.",
        remaining_questions=0,
    )

    strong_req = EvaluateAnswerRequest(
        user_id="eval-harness",
        category="TECHNICAL",
        difficulty="MEDIUM",
        target_role="Backend Developer",
        subcategories=["DBMS"],
        current_question=base_q,
        current_topic_tag="DBMS",
        current_model_answer=model_ans,
        current_is_follow_up=False,
        user_answer=(
            "PostgreSQL implements Multi-Version Concurrency Control using row tuple headers "
            "(xmin and xmax transaction IDs) so each transaction queries a point-in-time snapshot. "
            "Because reads do not lock rows against concurrent writes and writes create new row "
            "versions rather than overwriting in-place, readers never block writers and writers never "
            "block readers. Dead tuple versions left behind by updates/deletes are later reclaimed by VACUUM."
        ),
        remaining_questions=0,
    )

    weak_res = await evaluate_and_advance_interview(weak_req)
    strong_res = await evaluate_and_advance_interview(strong_req)

    print(f"Weak answer score:   {weak_res.score}%")
    print(f"Strong answer score: {strong_res.score}%")
    assert weak_res.score < 35.0, f"Calibration drift: weak answer scored too high ({weak_res.score})"
    assert strong_res.score >= 75.0, f"Calibration drift: strong answer scored too low ({strong_res.score})"
    print("CALIBRATION PASSED: Grader separation verified cleanly.")


if __name__ == "__main__":
    asyncio.run(run_calibration())
