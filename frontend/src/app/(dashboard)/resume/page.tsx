import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function ResumePage() {
  return (
    <UpcomingModuleCard
      phase="Phase 2"
      moduleName="AI Resume Analyzer & ATS Inspector"
      description="Upload PDF or DOCX resumes for layout-aware text extraction, deterministic ATS scoring, ChromaDB chunk indexing, and structured LLM bullet-point improvements."
      capabilities={[
        "Secure multipart upload with MIME & magic-byte validation",
        "PyMuPDF & python-docx section segmentation stored in PostgreSQL",
        "Deterministic ATS & formatting scoring combined with AI impact critiques",
        "ChromaDB vector indexing scoped cleanly per user_id",
      ]}
    />
  );
}
