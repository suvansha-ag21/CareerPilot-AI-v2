import re
from typing import Dict, List, Set, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.pipelines.resume_parser import extract_raw_text
from app.utils.skill_taxonomy import extract_canonical_skills

# Adjacency graph used for identifying partially transferable skills when exact match is missing
ADJACENT_SKILLS: Dict[str, Set[str]] = {
    "TypeScript": {"JavaScript"},
    "JavaScript": {"TypeScript"},
    "Next.js": {"React"},
    "React": {"Next.js"},
    "PostgreSQL": {"SQL", "MongoDB"},
    "SQL": {"PostgreSQL", "DBMS"},
    "Express.js": {"Node.js", "FastAPI", "Spring Boot"},
    "FastAPI": {"Python", "Flask", "Django", "Express.js"},
    "Django": {"Python", "FastAPI", "Flask"},
    "Flask": {"Python", "FastAPI"},
    "Spring Boot": {"Java", "Express.js", "REST APIs"},
    "Kubernetes": {"Docker"},
    "Docker": {"Linux", "CI/CD"},
    "PyTorch": {"TensorFlow", "Machine Learning"},
    "TensorFlow": {"PyTorch", "Machine Learning"},
    "Scikit-learn": {"Machine Learning", "Pandas", "NumPy"},
}


def extract_jd_text(
    raw_text: str | None, file_bytes: bytes | None, file_ext: str | None
) -> str:
    if raw_text and raw_text.strip():
        return raw_text.strip()
    if file_bytes and file_ext:
        ext = file_ext.lower().lstrip(".")
        if ext == "txt":
            return file_bytes.decode("utf-8", errors="ignore").strip()
        if ext in ("pdf", "docx"):
            return extract_raw_text(file_bytes, ext.upper())
    return ""


def split_jd_clauses(jd_text: str) -> List[str]:
    raw_lines = [
        ln.strip(" •-*-\t")
        for ln in re.split(r"[\n.;]+", jd_text)
        if len(ln.strip()) >= 18
    ]
    return raw_lines[:15]


def extract_min_years_from_jd(jd_text: str) -> float:
    matches = re.findall(r"(\d+)\s*\+?\s*(?:-|to)?\s*\d*\s*years?\s+of", jd_text, re.I)
    if not matches:
        matches = re.findall(r"minimum\s+of\s+(\d+)\s*years?", jd_text, re.I)
    if matches:
        nums = [float(m) for m in matches if int(m) <= 20]
        if nums:
            return min(nums)
    if re.search(r"\b(?:intern|internship|fresher|entry[\s-]level|new grad)\b", jd_text, re.I):
        return 0.0
    if re.search(r"\bsenior|staff|principal\b", jd_text, re.I):
        return 4.0
    return 1.0


def classify_skill_overlap(
    jd_required: List[str],
    jd_preferred: List[str],
    resume_skills: List[str],
) -> Tuple[List[str], List[str], List[str], float]:
    res_set = {s.lower(): s for s in resume_skills}

    # Combine required (weight 2.0) and preferred (weight 1.0)
    weighted_targets: Dict[str, float] = {}
    for s in jd_preferred:
        weighted_targets[s] = 1.0
    for s in jd_required:
        weighted_targets[s] = 2.0

    matching: List[str] = []
    partial: List[str] = []
    missing: List[str] = []

    earned_weight = 0.0
    total_weight = sum(weighted_targets.values())

    for skill, weight in weighted_targets.items():
        if skill.lower() in res_set:
            matching.append(skill)
            earned_weight += weight
        else:
            adj_set = ADJACENT_SKILLS.get(skill, set())
            has_adj = any(adj.lower() in res_set for adj in adj_set)
            if has_adj:
                partial.append(skill)
                earned_weight += weight * 0.5
            else:
                missing.append(skill)

    if total_weight == 0:
        return matching, partial, missing, 60.0

    return matching, partial, missing, round((earned_weight / total_weight) * 100.0, 1)


def compute_tfidf_alignment(resume_text: str, jd_text: str) -> float:
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([resume_text, jd_text])
    sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    # Calibrate 0.15-0.65 typical lexical similarity range cleanly
    return round(min(100.0, max(0.0, (sim / 0.55) * 100.0)), 1)


def compute_experience_score(candidate_years: int, required_years: float) -> float:
    if required_years <= 0:
        return 95.0 if candidate_years >= 0 else 80.0
    if candidate_years >= required_years:
        return 100.0
    gap = required_years - candidate_years
    if gap <= 1.0:
        return 80.0
    if gap <= 2.0:
        return 62.0
    return max(35.0, round(100.0 - (gap * 18.0), 1))
