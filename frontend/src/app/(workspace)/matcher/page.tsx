import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function MatcherPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 3"
      moduleName="AI Job Description Matcher"
      description="Paste or upload a target job description to compare your resume using semantic vector embeddings and hybrid skill scoring."
      capabilities={[
        "Semantic similarity computed via Sentence Transformers & ChromaDB",
        "Matching, partially matching, and missing skills breakdown",
        "Relevant project mapping and experience alignment checks",
        "Actionable tailoring tips grounded in the actual job description",
      ]}
    />
  );
}
