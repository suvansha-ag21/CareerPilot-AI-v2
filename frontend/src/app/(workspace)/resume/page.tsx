import { UpcomingModuleCard } from "@/components/layout/UpcomingModuleCard";

export default function ResumePage() {
  return (
    <UpcomingModuleCard
      phase="Phase 2"
      moduleName="AI Resume Analyzer & ATS Inspector"
      description="Upload PDF or DOCX resumes for PyMuPDF/python-docx parsing, spaCy entity extraction, ChromaDB indexing, and platform compatibility scoring."
      capabilities={[
        "Drag-and-drop upload with magic-byte validation & private storage",
        "Structured extraction of contact info, education, skills, projects & certifications",
        "Section-wise scoring, missing keywords, and AI bullet-point rewrites",
        "Explicit explanation of platform compatibility evaluation criteria",
      ]}
    />
  );
}
