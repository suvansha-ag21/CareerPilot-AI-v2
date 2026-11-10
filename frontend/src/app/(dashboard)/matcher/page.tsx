import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function MatcherPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 3"
      moduleName="Job Description Matcher & Skill Gap Analyzer"
      description="Compare your resume against any job description using hybrid vector embeddings, Scikit-learn TF-IDF keyword overlap, canonical skill normalization, and LLM reasoning."
      capabilities={[
        "Transparent weighted Match Score (Semantic + Skills + TF-IDF + Experience)",
        "Matched, partial, and missing skill breakdowns with severity prioritization",
        "Persistent SkillGap records saved to PostgreSQL across sessions",
        "Actionable bullet-tailoring recommendations per target job",
      ]}
    />
  );
}
