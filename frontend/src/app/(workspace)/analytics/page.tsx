import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function AnalyticsPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 7"
      moduleName="Deep Career Analytics"
      description="Explore longitudinal trends across interview scores, resume compatibility progression, skill growth, and application conversion statistics."
      capabilities={[
        "Interview score trendlines across DSA, HR, SQL, Python & Java sessions",
        "Resume improvement history & JD compatibility tracking",
        "Application funnel conversion analytics backed by PostgreSQL queries",
      ]}
    />
  );
}
