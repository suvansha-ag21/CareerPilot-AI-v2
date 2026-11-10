import io
import re
from typing import Dict, List, Tuple
import docx
import fitz  # PyMuPDF
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.nlp_loader import get_spacy_nlp
from app.schemas.resume_schema import ResumeContact
from app.utils.skill_taxonomy import (
    extract_canonical_skills,
    get_expected_skills_for_role,
)

SECTION_HEADERS = {
    "summary": ["summary", "objective", "profile", "about me", "career objective"],
    "education": ["education", "academic", "academics", "qualification", "qualifications"],
    "experience": ["experience", "work experience", "employment", "internship", "internships"],
    "projects": ["projects", "academic projects", "personal projects", "key projects"],
    "skills": ["skills", "technical skills", "technologies", "core competencies", "tech stack"],
    "certifications": ["certifications", "certificates", "awards", "achievements"],
}

STRONG_ACTION_VERBS = {
    "architected", "automated", "built", "created", "decreased", "delivered",
    "designed", "developed", "deployed", "engineered", "enhanced", "established",
    "implemented", "improved", "increased", "integrated", "launched", "led",
    "migrated", "optimized", "orchestrated", "reduced", "refactored", "scaled",
    "streamlined", "tested",
}


def extract_raw_text(file_bytes: bytes, file_type: str) -> str:
    if file_type.upper() == "PDF":
        pages_text: List[str] = []
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                # Extract text in natural reading order
                pages_text.append(page.get_text("text", sort=True))
        text = "\n".join(pages_text).strip()
        return re.sub(r"\n{3,}", "\n\n", text)

    if file_type.upper() == "DOCX":
        doc = docx.Document(io.BytesIO(file_bytes))
        lines: List[str] = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                row_vals = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_vals:
                    lines.append(" | ".join(row_vals))
        return "\n".join(lines).strip()

    raise ValueError(f"Unsupported file_type: {file_type}")


def detect_contact_and_entities(text: str) -> Tuple[ResumeContact, List[str]]:
    email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    phone_match = re.search(r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4}", text)
    github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_.-]+", text, re.I)
    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_.-]+", text, re.I)

    nlp = get_spacy_nlp()
    head_slice = text[:600]
    doc = nlp(head_slice)

    candidate_name = None
    location = None
    for ent in doc.ents:
        if ent.label_ == "PERSON" and not candidate_name:
            cand = ent.text.strip()
            if 1 <= len(cand.split()) <= 4 and "@" not in cand:
                candidate_name = cand
        elif ent.label_ in ("GPE", "LOC") and not location:
            location = ent.text.strip()

    # Fallback top line heuristic if spaCy did not tag PERSON on sparse header
    if not candidate_name:
        for line in text.splitlines()[:5]:
            stripped = line.strip()
            if stripped and "@" not in stripped and len(stripped.split()) <= 4 and not re.search(r"\d", stripped):
                candidate_name = stripped
                break

    detected_sections: List[str] = []
    lower_lines = [ln.strip().lower().rstrip(":") for ln in text.splitlines() if ln.strip()]
    for sec_key, aliases in SECTION_HEADERS.items():
        for ln in lower_lines:
            if any(ln == alias or ln.startswith(alias + " ") for alias in aliases) and len(ln) <= 38:
                if sec_key not in detected_sections:
                    detected_sections.append(sec_key)

    contact = ResumeContact(
        candidateName=candidate_name,
        email=email_match.group(0) if email_match else None,
        phone=phone_match.group(0).strip() if phone_match else None,
        location=location,
        githubUrl=f"https://{github_match.group(0).lstrip('https://').lstrip('http://')}" if github_match else None,
        linkedinUrl=f"https://{linkedin_match.group(0).lstrip('https://').lstrip('http://')}" if linkedin_match else None,
        portfolioUrl=None,
    )
    return contact, detected_sections


def compute_deterministic_metrics(
    text: str, target_role: str, detected_skills: List[str], sections_detected: List[str], contact: ResumeContact
) -> Dict[str, float]:
    words = text.split()
    word_count = len(words)

    # 1. Contact & Structure Score (0 - 100)
    contact_points = sum([
        25 if contact.email else 0,
        20 if contact.phone else 0,
        20 if (contact.githubUrl or contact.linkedinUrl) else 0,
        35 if len(sections_detected) >= 4 else len(sections_detected) * 8,
    ])
    structure_score = min(100.0, float(contact_points))

    # 2. Skill Coverage & Scikit-learn TF-IDF Alignment vs Target Role (0 - 100)
    expected = get_expected_skills_for_role(target_role)
    detected_lower = {s.lower() for s in detected_skills}
    matched = [s for s in expected if s.lower() in detected_lower]
    coverage_ratio = (len(matched) / len(expected)) if expected else 0.5

    role_benchmark_doc = f"{target_role} " + " ".join(expected)
    tfidf = TfidfVectorizer(stop_words="english")
    matrix = tfidf.fit_transform([text, role_benchmark_doc])
    tfidf_sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    skill_relevance_score = min(100.0, round((coverage_ratio * 70.0) + (min(1.0, tfidf_sim * 2.2) * 30.0), 1))

    # 3. Quantified Impact & Bullet Verb Strength (0 - 100)
    lines = [ln.strip() for ln in text.splitlines() if len(ln.strip()) > 20]
    quantified_lines = [ln for ln in lines if re.search(r"\b\d+(?:\.\d+)?%|\$\d+|\b\d+\s*(?:ms|sec|users|k\b|x\b|requests|clients)", ln, re.I)]
    verb_lines = [ln for ln in lines if ln.lstrip("•-* ").split(" ")[0].lower() in STRONG_ACTION_VERBS]

    quant_ratio = min(1.0, len(quantified_lines) / max(1, min(8, len(lines) * 0.25)))
    verb_ratio = min(1.0, len(verb_lines) / max(1, min(10, len(lines) * 0.3)))
    impact_score = round((quant_ratio * 60.0) + (verb_ratio * 40.0), 1)

    # 4. Formatting & Word Hygiene Score (ideal single/two-page engineering resume: 250-900 words)
    if 250 <= word_count <= 900:
        length_score = 100.0
    elif 150 <= word_count < 250 or 900 < word_count <= 1300:
        length_score = 75.0
    else:
        length_score = 50.0

    # Composite estimated platform compatibility score
    estimated_score = round(
        (structure_score * 0.20)
        + (skill_relevance_score * 0.35)
        + (impact_score * 0.25)
        + (length_score * 0.20),
        1,
    )

    return {
        "word_count": float(word_count),
        "structure_score": round(structure_score, 1),
        "skill_relevance_score": round(skill_relevance_score, 1),
        "impact_score": round(impact_score, 1),
        "length_score": round(length_score, 1),
        "estimated_score": estimated_score,
    }


def chunk_resume_for_vectors(text: str) -> List[Dict[str, str]]:
    """Splits resume into overlapping semantic chunks for ChromaDB indexing."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    chunks: List[Dict[str, str]] = []
    current_section = "general"
    buffer: List[str] = []

    for ln in lines:
        lower = ln.lower().rstrip(":")
        matched_sec = None
        if len(lower) <= 38:
            for sec_key, aliases in SECTION_HEADERS.items():
                if any(lower == a or lower.startswith(a + " ") for a in aliases):
                    matched_sec = sec_key
                    break

        if matched_sec:
            if buffer:
                chunks.append({"section": current_section, "text": "\n".join(buffer)})
                buffer = []
            current_section = matched_sec

        buffer.append(ln)
        if len("\n".join(buffer)) >= 750:
            chunks.append({"section": current_section, "text": "\n".join(buffer)})
            buffer = []

    if buffer:
        chunks.append({"section": current_section, "text": "\n".join(buffer)})

    return chunks
