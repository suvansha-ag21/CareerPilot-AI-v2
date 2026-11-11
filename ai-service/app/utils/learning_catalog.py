from typing import Dict, List, Tuple
from app.schemas.skills_schema import (
    LearningResourceSchema,
    ProficiencyStr,
    SkillCategoryStr,
    SkillImportanceStr,
)
from app.utils.skill_taxonomy import CANONICAL_SKILL_ALIASES

CATEGORY_LABELS: Dict[SkillCategoryStr, str] = {
    "CORE_CS": "Core CS & Architecture",
    "FRONTEND": "Frontend Engineering",
    "BACKEND": "Backend Systems",
    "DATABASE": "Databases & Storage",
    "AI_ML": "AI & Machine Learning",
    "DEVOPS": "Cloud & DevOps",
    "SOFT_SKILL": "Engineering Communication",
}

SKILL_METADATA: Dict[str, Tuple[SkillCategoryStr, List[str]]] = {
    "Data Structures & Algorithms": ("CORE_CS", []),
    "Object-Oriented Programming": ("CORE_CS", []),
    "OOP": ("CORE_CS", []),
    "DBMS": ("CORE_CS", ["SQL"]),
    "Operating Systems": ("CORE_CS", ["Data Structures & Algorithms"]),
    "Computer Networks": ("CORE_CS", []),
    "System Design": ("CORE_CS", ["DBMS", "REST APIs", "Operating Systems"]),
    "HTML/CSS": ("FRONTEND", []),
    "JavaScript": ("FRONTEND", ["HTML/CSS"]),
    "TypeScript": ("FRONTEND", ["JavaScript"]),
    "React": ("FRONTEND", ["JavaScript", "HTML/CSS"]),
    "Next.js": ("FRONTEND", ["React", "TypeScript"]),
    "Tailwind CSS": ("FRONTEND", ["HTML/CSS"]),
    "Node.js": ("BACKEND", ["JavaScript"]),
    "Express.js": ("BACKEND", ["Node.js", "REST APIs"]),
    "Python": ("BACKEND", []),
    "FastAPI": ("BACKEND", ["Python", "REST APIs"]),
    "Django": ("BACKEND", ["Python", "SQL"]),
    "Flask": ("BACKEND", ["Python", "REST APIs"]),
    "Java": ("BACKEND", ["OOP"]),
    "Spring Boot": ("BACKEND", ["Java", "OOP", "SQL", "REST APIs"]),
    "C++": ("CORE_CS", []),
    "Go": ("BACKEND", ["REST APIs"]),
    "REST APIs": ("BACKEND", []),
    "GraphQL": ("BACKEND", ["REST APIs"]),
    "SQL": ("DATABASE", []),
    "PostgreSQL": ("DATABASE", ["SQL"]),
    "MongoDB": ("DATABASE", []),
    "Redis": ("DATABASE", []),
    "Prisma": ("DATABASE", ["TypeScript", "PostgreSQL"]),
    "Machine Learning": ("AI_ML", ["Python", "NumPy", "Pandas"]),
    "Scikit-learn": ("AI_ML", ["Python", "NumPy", "Machine Learning"]),
    "PyTorch": ("AI_ML", ["Python", "NumPy"]),
    "TensorFlow": ("AI_ML", ["Python", "NumPy"]),
    "NLP": ("AI_ML", ["Python", "Machine Learning"]),
    "LangChain": ("AI_ML", ["Python", "Vector Databases"]),
    "Vector Databases": ("AI_ML", ["Python"]),
    "Pandas": ("AI_ML", ["Python"]),
    "NumPy": ("AI_ML", ["Python"]),
    "Git": ("DEVOPS", []),
    "Docker": ("DEVOPS", ["Linux"]),
    "Kubernetes": ("DEVOPS", ["Docker", "Linux"]),
    "AWS": ("DEVOPS", ["Linux", "Docker"]),
    "CI/CD": ("DEVOPS", ["Git", "Testing"]),
    "Linux": ("DEVOPS", []),
    "Testing": ("CORE_CS", []),
    "Technical Communication": ("SOFT_SKILL", []),
    "Problem Solving": ("SOFT_SKILL", []),
}

CURATED_RESOURCES: Dict[str, List[LearningResourceSchema]] = {
    "Data Structures & Algorithms": [
        LearningResourceSchema(title="NeetCode Roadmap & Curated Patterns", type="PRACTICE", url="https://neetcode.io/roadmap", estimatedHours=10),
        LearningResourceSchema(title="CP-Algorithms Reference Guide", type="DOC", url="https://cp-algorithms.com/", estimatedHours=4),
    ],
    "System Design": [
        LearningResourceSchema(title="The System Design Primer (GitHub)", type="DOC", url="https://github.com/donnemartin/system-design-primer", estimatedHours=6),
        LearningResourceSchema(title="ByteByteGo Architecture Guides", type="COURSE", url="https://blog.bytebytego.com/", estimatedHours=4),
    ],
    "TypeScript": [
        LearningResourceSchema(title="TypeScript Official Handbook", type="DOC", url="https://www.typescriptlang.org/docs/handbook/intro.html", estimatedHours=4),
        LearningResourceSchema(title="Type Challenges Practice Exercises", type="PRACTICE", url="https://github.com/type-challenges/type-challenges", estimatedHours=4),
    ],
    "React": [
        LearningResourceSchema(title="React Official Documentation (react.dev)", type="DOC", url="https://react.dev/learn", estimatedHours=5),
        LearningResourceSchema(title="Patterns.dev Modern React Patterns", type="COURSE", url="https://www.patterns.dev/react", estimatedHours=3),
    ],
    "Next.js": [
        LearningResourceSchema(title="Next.js App Router Official Learn Track", type="COURSE", url="https://nextjs.org/learn", estimatedHours=6),
        LearningResourceSchema(title="Next.js Data Fetching & Caching Docs", type="DOC", url="https://nextjs.org/docs/app", estimatedHours=3),
    ],
    "Node.js": [
        LearningResourceSchema(title="Node.js Official Learn Guides", type="DOC", url="https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", estimatedHours=4),
    ],
    "Express.js": [
        LearningResourceSchema(title="Express.js Routing & Middleware Guide", type="DOC", url="https://expressjs.com/en/guide/routing.html", estimatedHours=3),
    ],
    "Python": [
        LearningResourceSchema(title="Official Python Tutorial & Standard Library", type="DOC", url="https://docs.python.org/3/tutorial/", estimatedHours=5),
    ],
    "FastAPI": [
        LearningResourceSchema(title="FastAPI Official Tutorial & User Guide", type="DOC", url="https://fastapi.tiangolo.com/tutorial/", estimatedHours=4),
    ],
    "Java": [
        LearningResourceSchema(title="Dev.java Official Java Learning Paths", type="COURSE", url="https://dev.java/learn/", estimatedHours=6),
    ],
    "Spring Boot": [
        LearningResourceSchema(title="Spring Official Building a RESTful Web Service", type="PROJECT", url="https://spring.io/guides/gs/rest-service", estimatedHours=4),
        LearningResourceSchema(title="Spring Boot Reference Documentation", type="DOC", url="https://docs.spring.io/spring-boot/index.html", estimatedHours=5),
    ],
    "SQL": [
        LearningResourceSchema(title="PostgreSQL Tutorial & Window Functions", type="PRACTICE", url="https://www.postgresql.org/docs/current/tutorial.html", estimatedHours=4),
        LearningResourceSchema(title="SQLBolt Interactive Lessons", type="PRACTICE", url="https://sqlbolt.com/", estimatedHours=3),
    ],
    "PostgreSQL": [
        LearningResourceSchema(title="PostgreSQL Indexing & Query Performance", type="DOC", url="https://www.postgresql.org/docs/current/indexes.html", estimatedHours=4),
    ],
    "Redis": [
        LearningResourceSchema(title="Redis University & Caching Patterns", type="DOC", url="https://redis.io/docs/latest/develop/", estimatedHours=3),
    ],
    "Docker": [
        LearningResourceSchema(title="Docker Official Getting Started Workshop", type="PROJECT", url="https://docs.docker.com/get-started/workshop/", estimatedHours=4),
    ],
    "Kubernetes": [
        LearningResourceSchema(title="Kubernetes Basics Interactive Tutorial", type="COURSE", url="https://kubernetes.io/docs/tutorials/kubernetes-basics/", estimatedHours=5),
    ],
    "AWS": [
        LearningResourceSchema(title="AWS Skill Builder Cloud Practitioner Essentials", type="COURSE", url="https://explore.skillbuilder.aws/", estimatedHours=6),
    ],
    "CI/CD": [
        LearningResourceSchema(title="GitHub Actions Quickstart & Workflows", type="DOC", url="https://docs.github.com/en/actions/quickstart", estimatedHours=3),
    ],
    "Machine Learning": [
        LearningResourceSchema(title="Google Machine Learning Crash Course", type="COURSE", url="https://developers.google.com/machine-learning/crash-course", estimatedHours=8),
    ],
    "Scikit-learn": [
        LearningResourceSchema(title="Scikit-learn Official User Guide", type="DOC", url="https://scikit-learn.org/stable/user_guide.html", estimatedHours=5),
    ],
    "PyTorch": [
        LearningResourceSchema(title="PyTorch Learn the Basics Tutorials", type="COURSE", url="https://pytorch.org/tutorials/beginner/basics/intro.html", estimatedHours=6),
    ],
    "NLP": [
        LearningResourceSchema(title="Hugging Face NLP Course", type="COURSE", url="https://huggingface.co/learn/nlp-course/chapter1/1", estimatedHours=6),
    ],
    "Vector Databases": [
        LearningResourceSchema(title="ChromaDB Getting Started & Embeddings Guide", type="DOC", url="https://docs.trychroma.com/docs/overview/getting-started", estimatedHours=3),
    ],
    "Testing": [
        LearningResourceSchema(title="Martin Fowler Practical Test Pyramid", type="DOC", url="https://martinfowler.com/articles/practical-test-pyramid.html", estimatedHours=2),
    ],
}

SkillSpecTuple = Tuple[str, SkillImportanceStr, ProficiencyStr]

ROLE_SKILL_BLUEPRINTS: Dict[str, List[SkillSpecTuple]] = {
    "Full Stack Developer": [
        ("TypeScript", "CRITICAL", "INTERMEDIATE"),
        ("React", "CRITICAL", "INTERMEDIATE"),
        ("Next.js", "IMPORTANT", "INTERMEDIATE"),
        ("Node.js", "CRITICAL", "INTERMEDIATE"),
        ("Express.js", "IMPORTANT", "INTERMEDIATE"),
        ("SQL", "CRITICAL", "INTERMEDIATE"),
        ("PostgreSQL", "IMPORTANT", "INTERMEDIATE"),
        ("REST APIs", "CRITICAL", "INTERMEDIATE"),
        ("Git", "CRITICAL", "INTERMEDIATE"),
        ("Docker", "IMPORTANT", "BEGINNER"),
        ("System Design", "NICE_TO_HAVE", "BEGINNER"),
        ("Testing", "IMPORTANT", "BEGINNER"),
    ],
    "Software Engineer Intern": [
        ("Data Structures & Algorithms", "CRITICAL", "INTERMEDIATE"),
        ("OOP", "CRITICAL", "INTERMEDIATE"),
        ("DBMS", "CRITICAL", "INTERMEDIATE"),
        ("Operating Systems", "IMPORTANT", "BEGINNER"),
        ("Python", "IMPORTANT", "INTERMEDIATE"),
        ("Java", "IMPORTANT", "INTERMEDIATE"),
        ("SQL", "CRITICAL", "INTERMEDIATE"),
        ("Git", "CRITICAL", "BEGINNER"),
        ("REST APIs", "IMPORTANT", "BEGINNER"),
        ("Computer Networks", "NICE_TO_HAVE", "BEGINNER"),
    ],
    "Backend Software Engineer": [
        ("Python", "IMPORTANT", "INTERMEDIATE"),
        ("Node.js", "CRITICAL", "ADVANCED"),
        ("PostgreSQL", "CRITICAL", "INTERMEDIATE"),
        ("SQL", "CRITICAL", "ADVANCED"),
        ("Redis", "IMPORTANT", "INTERMEDIATE"),
        ("REST APIs", "CRITICAL", "ADVANCED"),
        ("System Design", "CRITICAL", "INTERMEDIATE"),
        ("Docker", "CRITICAL", "INTERMEDIATE"),
        ("CI/CD", "IMPORTANT", "BEGINNER"),
        ("Testing", "IMPORTANT", "INTERMEDIATE"),
        ("Git", "CRITICAL", "INTERMEDIATE"),
    ],
    "Frontend Developer": [
        ("HTML/CSS", "CRITICAL", "ADVANCED"),
        ("JavaScript", "CRITICAL", "ADVANCED"),
        ("TypeScript", "CRITICAL", "INTERMEDIATE"),
        ("React", "CRITICAL", "ADVANCED"),
        ("Next.js", "IMPORTANT", "INTERMEDIATE"),
        ("REST APIs", "IMPORTANT", "INTERMEDIATE"),
        ("Testing", "IMPORTANT", "INTERMEDIATE"),
        ("Git", "CRITICAL", "INTERMEDIATE"),
        ("CI/CD", "NICE_TO_HAVE", "BEGINNER"),
    ],
    "Data Scientist & ML Engineer": [
        ("Python", "CRITICAL", "ADVANCED"),
        ("SQL", "CRITICAL", "INTERMEDIATE"),
        ("Pandas", "CRITICAL", "INTERMEDIATE"),
        ("NumPy", "CRITICAL", "INTERMEDIATE"),
        ("Machine Learning", "CRITICAL", "INTERMEDIATE"),
        ("Scikit-learn", "CRITICAL", "INTERMEDIATE"),
        ("PyTorch", "IMPORTANT", "INTERMEDIATE"),
        ("NLP", "IMPORTANT", "INTERMEDIATE"),
        ("Vector Databases", "IMPORTANT", "BEGINNER"),
        ("Docker", "NICE_TO_HAVE", "BEGINNER"),
        ("Git", "IMPORTANT", "INTERMEDIATE"),
    ],
    "Java Spring Boot Developer": [
        ("Java", "CRITICAL", "ADVANCED"),
        ("Spring Boot", "CRITICAL", "INTERMEDIATE"),
        ("OOP", "CRITICAL", "ADVANCED"),
        ("SQL", "CRITICAL", "INTERMEDIATE"),
        ("PostgreSQL", "IMPORTANT", "INTERMEDIATE"),
        ("REST APIs", "CRITICAL", "INTERMEDIATE"),
        ("Data Structures & Algorithms", "IMPORTANT", "INTERMEDIATE"),
        ("Docker", "IMPORTANT", "BEGINNER"),
        ("Testing", "IMPORTANT", "INTERMEDIATE"),
        ("Git", "CRITICAL", "INTERMEDIATE"),
    ],
    "Python Backend Developer": [
        ("Python", "CRITICAL", "ADVANCED"),
        ("FastAPI", "CRITICAL", "INTERMEDIATE"),
        ("SQL", "CRITICAL", "INTERMEDIATE"),
        ("PostgreSQL", "CRITICAL", "INTERMEDIATE"),
        ("Redis", "IMPORTANT", "INTERMEDIATE"),
        ("REST APIs", "CRITICAL", "INTERMEDIATE"),
        ("Docker", "IMPORTANT", "INTERMEDIATE"),
        ("Testing", "IMPORTANT", "INTERMEDIATE"),
        ("Git", "CRITICAL", "INTERMEDIATE"),
        ("System Design", "NICE_TO_HAVE", "BEGINNER"),
    ],
}

EXTRA_ALIAS_MAP: Dict[str, str] = {
    "object-oriented programming": "OOP",
    "object oriented programming": "OOP",
    "dsa": "Data Structures & Algorithms",
    "data structures & algorithms": "Data Structures & Algorithms",
    "postgres": "PostgreSQL",
    "expressjs": "Express.js",
    "nodejs": "Node.js",
    "nextjs": "Next.js",
    "reactjs": "React",
    "rest api": "REST APIs",
    "restful apis": "REST APIs",
    "sklearn": "Scikit-learn",
}


def canonicalize_skill_name(raw_name: str) -> str:
    cleaned = raw_name.strip()
    lowered = cleaned.lower()
    if lowered in EXTRA_ALIAS_MAP:
        return EXTRA_ALIAS_MAP[lowered]
    for canonical, aliases in CANONICAL_SKILL_ALIASES.items():
        if canonical.lower() == lowered or lowered in aliases:
            return canonical
    return cleaned


def get_role_blueprint(target_role: str) -> List[SkillSpecTuple]:
    if target_role in ROLE_SKILL_BLUEPRINTS:
        return list(ROLE_SKILL_BLUEPRINTS[target_role])
    lower = target_role.lower()
    if "data" in lower or "ml" in lower or "ai" in lower:
        return list(ROLE_SKILL_BLUEPRINTS["Data Scientist & ML Engineer"])
    if "java" in lower or "spring" in lower:
        return list(ROLE_SKILL_BLUEPRINTS["Java Spring Boot Developer"])
    if "python" in lower or "fastapi" in lower or "django" in lower:
        return list(ROLE_SKILL_BLUEPRINTS["Python Backend Developer"])
    if "frontend" in lower or "react" in lower or "ui" in lower:
        return list(ROLE_SKILL_BLUEPRINTS["Frontend Developer"])
    if "backend" in lower or "api" in lower:
        return list(ROLE_SKILL_BLUEPRINTS["Backend Software Engineer"])
    if "intern" in lower or "fresher" in lower or "graduate" in lower:
        return list(ROLE_SKILL_BLUEPRINTS["Software Engineer Intern"])
    return list(ROLE_SKILL_BLUEPRINTS["Full Stack Developer"])


def get_skill_resources(skill_name: str) -> List[LearningResourceSchema]:
    canonical = canonicalize_skill_name(skill_name)
    if canonical in CURATED_RESOURCES:
        return list(CURATED_RESOURCES[canonical])
    query = canonical.replace(" ", "+")
    return [
        LearningResourceSchema(
            title=f"{canonical} Documentation & Reference",
            type="DOC",
            url=f"https://roadmap.sh/search?q={query}",
            estimatedHours=4,
        ),
        LearningResourceSchema(
            title=f"Applied {canonical} Mini-Project Practice",
            type="PROJECT",
            url=f"https://github.com/search?q={query}+starter+project",
            estimatedHours=4,
        ),
    ]
