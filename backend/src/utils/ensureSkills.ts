import { SkillCategory } from "@prisma/client";
import { prisma } from "../config/prisma";

const CORE_CANONICAL_SKILLS: Array<{
  name: string;
  normalizedName: string;
  category: SkillCategory;
}> = [
  { name: "Data Structures & Algorithms", normalizedName: "dsa", category: "CORE_CS" },
  { name: "Object-Oriented Programming", normalizedName: "oop", category: "CORE_CS" },
  { name: "DBMS", normalizedName: "dbms", category: "CORE_CS" },
  { name: "Operating Systems", normalizedName: "operating systems", category: "CORE_CS" },
  { name: "Computer Networks", normalizedName: "computer networks", category: "CORE_CS" },
  { name: "System Design", normalizedName: "system design", category: "CORE_CS" },
  { name: "HTML/CSS", normalizedName: "html/css", category: "FRONTEND" },
  { name: "JavaScript", normalizedName: "javascript", category: "FRONTEND" },
  { name: "TypeScript", normalizedName: "typescript", category: "FRONTEND" },
  { name: "React", normalizedName: "react", category: "FRONTEND" },
  { name: "Next.js", normalizedName: "next.js", category: "FRONTEND" },
  { name: "Tailwind CSS", normalizedName: "tailwind css", category: "FRONTEND" },
  { name: "Node.js", normalizedName: "node.js", category: "BACKEND" },
  { name: "Express.js", normalizedName: "express.js", category: "BACKEND" },
  { name: "Java", normalizedName: "java", category: "BACKEND" },
  { name: "Spring Boot", normalizedName: "spring boot", category: "BACKEND" },
  { name: "Python", normalizedName: "python", category: "BACKEND" },
  { name: "FastAPI", normalizedName: "fastapi", category: "BACKEND" },
  { name: "REST APIs", normalizedName: "rest apis", category: "BACKEND" },
  { name: "SQL", normalizedName: "sql", category: "DATABASE" },
  { name: "PostgreSQL", normalizedName: "postgresql", category: "DATABASE" },
  { name: "MongoDB", normalizedName: "mongodb", category: "DATABASE" },
  { name: "Redis", normalizedName: "redis", category: "DATABASE" },
  { name: "Machine Learning", normalizedName: "machine learning", category: "AI_ML" },
  { name: "Scikit-learn", normalizedName: "scikit-learn", category: "AI_ML" },
  { name: "PyTorch", normalizedName: "pytorch", category: "AI_ML" },
  { name: "NLP", normalizedName: "nlp", category: "AI_ML" },
  { name: "LangChain", normalizedName: "langchain", category: "AI_ML" },
  { name: "Vector Databases", normalizedName: "vector databases", category: "AI_ML" },
  { name: "Git", normalizedName: "git", category: "DEVOPS" },
  { name: "Docker", normalizedName: "docker", category: "DEVOPS" },
  { name: "CI/CD", normalizedName: "ci/cd", category: "DEVOPS" },
  { name: "AWS", normalizedName: "aws", category: "DEVOPS" },
  { name: "Linux", normalizedName: "linux", category: "DEVOPS" },
  { name: "Technical Communication", normalizedName: "technical communication", category: "SOFT_SKILL" },
  { name: "Problem Solving", normalizedName: "problem solving", category: "SOFT_SKILL" },
];

/**
 * Ensures canonical skills exist in PostgreSQL if the server boots against a fresh database.
 */
export async function ensureCanonicalSkillsSeeded(): Promise<void> {
  try {
    const existingCount = await prisma.skill.count();
    if (existingCount > 0) return;

    await prisma.skill.createMany({
      data: CORE_CANONICAL_SKILLS,
      skipDuplicates: true,
    });
    console.log(
      `[CareerPilot Gateway] Seeded ${CORE_CANONICAL_SKILLS.length} canonical skills automatically.`
    );
  } catch (err) {
    console.warn("[CareerPilot Gateway] Canonical skill bootstrap skipped:", err);
  }
}
