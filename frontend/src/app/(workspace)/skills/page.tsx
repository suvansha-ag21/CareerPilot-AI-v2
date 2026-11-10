import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function SkillsPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 4"
      moduleName="AI Skill Gap Analyzer"
      description="Benchmark your current normalized UserSkill inventory against your target role to detect gaps and generate structured skill sequences."
      capabilities={[
        "Role-based skill requirement comparisons (Full Stack, Intern, Backend, ML)",
        "Skill categorization by importance & proficiency levels (Beginner, Intermediate, Advanced)",
        "Curated learning resources & dependency-ordered sequence recommendations",
      ]}
    />
  );
}
