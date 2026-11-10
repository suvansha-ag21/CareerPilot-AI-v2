import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function InterviewPage() {
  return (
    <UpcomingModuleCard
      phase="Phase 5 & Phase 6"
      moduleName="AI Mock & Voice Interview System"
      description="Configure category, difficulty, duration, and question count for adaptive text and voice interviews grounded in a 9-subject RAG knowledge base."
      capabilities={[
        "Categories: Technical, HR, DSA, Java, Python, SQL, Full Stack & Project-Based",
        "RAG-grounded questions from DSA, DBMS, OS, CN, OOP & Full Stack KB",
        "Adaptive follow-ups & 5-criterion structured rubric reports (Phase 5)",
        "Explicit-consent mic recording, Whisper STT & spoken AI questions (Phase 6)",
      ]}
    />
  );
}
