import { PrismaClient, SkillCategory } from "../../node_modules/.prisma/client";

const prisma = new PrismaClient();

const CANONICAL_SKILLS: Array<{ name: string; normalizedName: string; category: SkillCategory }> = [
  // CORE CS
  { name: "Data Structures & Algorithms", normalizedName: "dsa", category: "CORE_CS" },
  { name: "Object-Oriented Programming", normalizedName: "oop", category: "CORE_CS" },
  { name: "DBMS", normalizedName: "dbms", category: "CORE_CS" },
  { name: "Operating Systems", normalizedName: "operating systems", category: "CORE_CS" },
  { name: "Computer Networks", normalizedName: "computer networks", category: "CORE_CS" },
  { name: "System Design", normalizedName: "system design", category: "CORE_CS" },

  // FRONTEND
  { name: "HTML/CSS", normalizedName: "html/css", category: "FRONTEND" },
  { name: "JavaScript", normalizedName: "javascript", category: "FRONTEND" },
  { name: "TypeScript", normalizedName: "typescript", category: "FRONTEND" },
  { name: "React", normalizedName: "react", category: "FRONTEND" },
  { name: "Next.js", normalizedName: "next.js", category: "FRONTEND" },
  { name: "Tailwind CSS", normalizedName: "tailwind css", category: "FRONTEND" },

  // BACKEND
  { name: "Node.js", normalizedName: "node.js", category: "BACKEND" },
  { name: "Express.js", normalizedName: "express.js", category: "BACKEND" },
  { name: "Java", normalizedName: "java", category: "BACKEND" },
  { name: "Spring Boot", normalizedName: "spring boot", category: "BACKEND" },
  { name: "Python", normalizedName: "python", category: "BACKEND" },
  { name: "FastAPI", normalizedName: "fastapi", category: "BACKEND" },
  { name: "REST APIs", normalizedName: "rest apis", category: "BACKEND" },

  // DATABASE
  { name: "SQL", normalizedName: "sql", category: "DATABASE" },
  { name: "PostgreSQL", normalizedName: "postgresql", category: "DATABASE" },
  { name: "MongoDB", normalizedName: "mongodb", category: "DATABASE" },
  { name: "Redis", normalizedName: "redis", category: "DATABASE" },

  // AI_ML
  { name: "Machine Learning", normalizedName: "machine learning", category: "AI_ML" },
  { name: "Scikit-learn", normalizedName: "scikit-learn", category: "AI_ML" },
  { name: "PyTorch", normalizedName: "pytorch", category: "AI_ML" },
  { name: "NLP", normalizedName: "nlp", category: "AI_ML" },
  { name: "LangChain", normalizedName: "langchain", category: "AI_ML" },
  { name: "Vector Databases", normalizedName: "vector databases", category: "AI_ML" },

  // DEVOPS
  { name: "Git", normalizedName: "git", category: "DEVOPS" },
  { name: "Docker", normalizedName: "docker", category: "DEVOPS" },
  { name: "CI/CD", normalizedName: "ci/cd", category: "DEVOPS" },
  { name: "AWS", normalizedName: "aws", category: "DEVOPS" },
  { name: "Linux", normalizedName: "linux", category: "DEVOPS" },

  // SOFT_SKILL
  { name: "Technical Communication", normalizedName: "technical communication", category: "SOFT_SKILL" },
  { name: "Problem Solving", normalizedName: "problem solving", category: "SOFT_SKILL" },
];

async function main() {
  for (const skill of CANONICAL_SKILLS) {
    await prisma.skill.upsert({
      where: { normalizedName: skill.normalizedName },
      update: { name: skill.name, category: skill.category },
      create: skill,
    });
  }
  console.log(`[Seed] Verified ${CANONICAL_SKILLS.length} canonical skills in PostgreSQL.`);
}

main()
  .catch((e) => {
    console.error("[SeedError]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
