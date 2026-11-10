import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function InterviewPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 4"
      moduleName="AI Mock & Voice Interview Studio"
      description="Practice live text or spoken technical interviews grounded in your actual resume, target JD, and previously recorded skill gaps with adaptive follow-up probing."
      capabilities={[
        "Context-aware opening prompts and adaptive difficulty escalation",
        "Browser voice recording -> Whisper STT -> WPM & filler-word speech analytics",
        "Neural TTS spoken interviewer questions and critique summaries",
        "Automatic SkillGap feedback loop syncing weak topics back to PostgreSQL",
      ]}
    />
  );
}
