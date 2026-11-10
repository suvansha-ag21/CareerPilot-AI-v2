import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function ApplicationsTrackerPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 7"
      moduleName="Job Application Tracker"
      description="Manage job applications across Applied, Assessment, Interview Scheduled, Selected, Rejected, and Offer Received stages."
      capabilities={[
        "Searchable, sortable & filterable application pipeline table",
        "Interview date scheduling surfaced on the Overview Dashboard",
        "Real conversion rates (Selection Rate, Rejection Rate, Active Funnel)",
      ]}
    />
  );
}
