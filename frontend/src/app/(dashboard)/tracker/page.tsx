import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function TrackerPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 6"
      moduleName="Job Application Tracker & Full Analytics"
      description="Manage your job pipeline across Kanban & Table stages while generating live conversion funnel charts and weekly readiness trends."
      capabilities={[
        "Kanban & Table application tracking linked to Resumes & Match Analyses",
        "Immutable ApplicationStatusHistory event log for real funnel analytics",
        "Recharts Skill Radar, Readiness Trendline, and Funnel Conversion charts",
      ]}
    />
  );
}
