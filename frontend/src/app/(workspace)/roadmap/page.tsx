import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function RoadmapPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 4"
      moduleName="Personalized Learning Roadmap"
      description="Follow week-by-week and day-by-day preparation plans built automatically from your open skill gaps and target role."
      capabilities={[
        "Weekly & daily learning tasks synced to PostgreSQL",
        "Skill priority tags, completion checkboxes & recommended resources",
        "Dynamic roadmap progress recalculation updating Overview Dashboard",
      ]}
    />
  );
}
