import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function RoadmapPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 5"
      moduleName="Personalized Learning Roadmap"
      description="Dependency-ordered weekly learning phases and milestones engineered directly from your open Skill Gaps and target career role."
      capabilities={[
        "Structured phases & milestone checklists persisted in PostgreSQL",
        "Curated learning resources and targeted interview drill prompts",
        "Real-time progress recalculation updating dashboard readiness",
      ]}
    />
  );
}
