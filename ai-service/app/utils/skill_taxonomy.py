import re
from typing import Dict, List

# Canonical engineering skill taxonomy -> list of normalized aliases
CANONICAL_SKILL_ALIASES: Dict[str, List[str]] = {
    "JavaScript": ["javascript", "js", "es6", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "react.js", "reactjs"],
    "Next.js": ["next.js", "nextjs", "next js"],
    "HTML/CSS": ["html", "css", "html5", "css3", "tailwind", "tailwindcss", "scss", "sass"],
    "Node.js": ["node.js", "nodejs", "node js"],
    "Express.js": ["express", "express.js", "expressjs"],
    "Python": ["python", "python3"],
    "FastAPI": ["fastapi", "fast api"],
    "Django": ["django"],
    "Flask": ["flask"],
    "Java": ["java", "core java", "jdk"],
    "Spring Boot": ["spring boot", "springboot", "spring framework"],
    "C++": ["c++", "cpp"],
    "Go": ["golang"],
    "SQL": ["sql", "mysql", "sqlite", "t-sql"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MongoDB": ["mongodb", "mongo", "mongoose"],
    "Redis": ["redis"],
    "Prisma": ["prisma"],
    "REST APIs": ["rest", "rest api", "restful", "rest apis", "restful apis"],
    "GraphQL": ["graphql"],
    "Data Structures & Algorithms": ["dsa", "data structures", "algorithms", "leetcode"],
    "System Design": ["system design", "distributed systems", "microservices"],
    "OOP": ["oop", "object oriented programming", "object-oriented"],
    "DBMS": ["dbms", "database management"],
    "Operating Systems": ["operating systems", "os"],
    "Computer Networks": ["computer networks", "tcp/ip", "networking"],
    "Git": ["git", "github", "gitlab"],
    "Docker": ["docker", "containerization", "containers"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services", "ec2", "s3"],
    "CI/CD": ["ci/cd", "github actions", "jenkins"],
    "Linux": ["linux", "ubuntu", "bash"],
    "Machine Learning": ["machine learning", "ml", "supervised learning"],
    "Scikit-learn": ["scikit-learn", "sklearn"],
    "PyTorch": ["pytorch"],
    "TensorFlow": ["tensorflow"],
    "NLP": ["nlp", "natural language processing", "spacy"],
    "LangChain": ["langchain", "llamaindex", "rag"],
    "Vector Databases": ["chromadb", "chroma", "faiss", "pinecone", "pgvector"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Testing": ["jest", "pytest", "playwright", "cypress", "unit testing"],
}

# Core target role expectations used for deterministic relevance & missing keyword hints
ROLE_CORE_SKILLS: Dict[str, List[str]] = {
    "Full Stack Developer": [
        "HTML/CSS", "JavaScript", "TypeScript", "React", "Next.js",
        "Node.js", "Express.js", "SQL", "PostgreSQL", "REST APIs", "Git", "Docker"
    ],
    "Software Engineer Intern": [
        "Data Structures & Algorithms", "OOP", "DBMS", "Operating Systems",
        "Java", "Python", "SQL", "Git", "REST APIs"
    ],
    "Backend Software Engineer": [
        "Node.js", "Python", "Java", "PostgreSQL", "SQL", "Redis",
        "REST APIs", "System Design", "Docker", "Git", "Testing"
    ],
    "Frontend Developer": [
        "HTML/CSS", "JavaScript", "TypeScript", "React", "Next.js",
        "REST APIs", "Git", "Testing"
    ],
    "Data Scientist & ML Engineer": [
        "Python", "SQL", "Machine Learning", "Scikit-learn", "PyTorch",
        "Pandas", "NumPy", "NLP", "Vector Databases", "Docker", "Git"
    ],
    "Java Spring Boot Developer": [
        "Java", "Spring Boot", "SQL", "PostgreSQL", "REST APIs",
        "Data Structures & Algorithms", "OOP", "Docker", "Git"
    ],
    "Python Backend Developer": [
        "Python", "FastAPI", "Django", "SQL", "PostgreSQL",
        "Redis", "REST APIs", "Docker", "Git", "Testing"
    ],
}


def extract_canonical_skills(text: str) -> List[str]:
    lowered = f" {text.lower()} "
    detected: List[str] = []

    for canonical, aliases in CANONICAL_SKILL_ALIASES.items():
        for alias in aliases:
            escaped = re.escape(alias)
            # Match whole token boundaries cleanly even around punctuation like C++ or Next.js
            pattern = rf"(?<![a-z0-9]){escaped}(?![a-z0-9])"
            if re.search(pattern, lowered):
                detected.append(canonical)
                break

    return detected


def get_expected_skills_for_role(target_role: str) -> List[str]:
    if target_role in ROLE_CORE_SKILLS:
        return ROLE_CORE_SKILLS[target_role]
    lower_role = target_role.lower()
    if "data" in lower_role or "ml" in lower_role or "ai" in lower_role:
        return ROLE_CORE_SKILLS["Data Scientist & ML Engineer"]
    if "frontend" in lower_role:
        return ROLE_CORE_SKILLS["Frontend Developer"]
    if "java" in lower_role:
        return ROLE_CORE_SKILLS["Java Spring Boot Developer"]
    if "python" in lower_role:
        return ROLE_CORE_SKILLS["Python Backend Developer"]
    if "backend" in lower_role:
        return ROLE_CORE_SKILLS["Backend Software Engineer"]
    if "intern" in lower_role:
        return ROLE_CORE_SKILLS["Software Engineer Intern"]
    return ROLE_CORE_SKILLS["Full Stack Developer"]
