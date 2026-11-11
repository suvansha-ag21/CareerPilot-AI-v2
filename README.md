# CareerPilot AI – AI-Powered Career & Interview Intelligence Platform

A full-stack, AI-powered career development SaaS workspace combining a **Next.js 14 (TypeScript)** frontend, an **Express.js (TypeScript)** API gateway backed by **PostgreSQL + Prisma ORM**, and a dedicated **Python + FastAPI** AI/ML microservice powered by **ChromaDB RAG**, **Scikit-learn**, **Sentence Transformers (`BAAI/bge-small-en-v1.5`)**, **spaCy**, and **Gemini / OpenAI** structured LLM pipelines.

## Architecture Overview
- **Frontend (`frontend/`)**: Next.js 14 App Router, Tailwind CSS (`#111827` dark sidebar, `#F8FAFC` light workspace, `#6D5DFB` primary accent), Recharts, Lucide React.
- **API Gateway (`backend/`)**: Express + TypeScript, Helmet security headers, rate limiting, JWT Access + rotated `HttpOnly` Refresh token cookies, Zod validation, Multer file validation, Prisma ORM.
- **AI Microservice (`ai-service/`)**: FastAPI secured via `X-Internal-Service-Key`, PyMuPDF & python-docx parsers, spaCy NER, Scikit-learn TF-IDF, ChromaDB dual vector collections (`resume_chunks` + 9-topic `cs_knowledge_base`), audio STT transcription + WPM analysis, Pydantic-validated structured LLM orchestration.
- **Database (`database/`)**: Normalized PostgreSQL 18 schema (`User`, `RefreshToken`, `PasswordResetToken`, `Education`, `WorkExperience`, `CandidateProject`, `Skill`, `UserSkill`, `Resume`, `JobMatch`, `LearningRoadmap`, `RoadmapTask`, `Interview`, `InterviewQuestion`, `JobApplication`) + local persistent ChromaDB store.
- **Shared (`shared/`)**: End-to-end TypeScript DTOs, enums, design tokens, and Zod validation schemas shared between `frontend/` and `backend/`.

## Implemented Modules (All 8 Phases Complete)
1. **Authentication & Candidate Profile**: JWT + rotated Refresh cookie family replay detection, Forgot/Reset Password, normalized Educations, Work Experiences, Projects, and Canonical Skills (`/profile`, `/settings`, `/dashboard`).
2. **AI Resume Analyzer (`/resume`)**: PDF/DOCX magic-byte verification, layout/NER extraction, ATS scoring breakdown, ChromaDB vector indexing, bullet rewrites, and owner-authenticated PDF preview.
3. **AI Job Description Matcher (`/matcher`)**: Hybrid ChromaDB Sentence-Transformer semantic similarity + Scikit-learn TF-IDF + canonical/transferable skill matching + AI tailoring recommendations.
4. **AI Skill Gap Analyzer & Personalized Roadmap (`/skills`, `/roadmap`)**: Role readiness benchmarking, topological prerequisite study ordering, curated learning resources, and week-by-week sprint generation persisted in PostgreSQL.
5. **AI Mock Interview System (`/interview`)**: 8 categories (`TECHNICAL`, `DSA`, `FULL_STACK`, `PYTHON`, `JAVA`, `SQL`, `PROJECT_BASED`, `HR`), 9-topic CS ChromaDB RAG retrieval, 5-criterion rubric grading, adaptive follow-up probes, and radar performance dossiers.
6. **Voice-Based AI Interview (`/interview`)**: Explicit-consent browser `MediaRecorder` capture, Web Speech Synthesis question playback, server-side audio transcription + WPM/filler-word delivery analytics (`audioUrl` + `speechMetrics`).
7. **Job Application Tracker & Deep Analytics (`/applications`, `/analytics`)**: Table & Kanban pipeline stages (`APPLIED` → `OFFER_RECEIVED`), interview date sync to Dashboard, score trendlines, funnel conversion rates, and recurring weak-topic hotspots.
8. **Hardening & Deployment Ready**: Cross-user isolation checks (`404` on unowned resources), strict file/audio validation, Docker Compose (`docker-compose.yml`), and comprehensive API specs (`docs/API_SPEC.md`).

## Local Development Setup
1. Configure `.env` files in `backend/.env` and `ai-service/.env` (`DATABASE_URL`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, `GEMINI_API_KEY`).
2. Start PostgreSQL and apply Prisma schema/seeds:
   ```bash
   npx --workspace=database prisma migrate deploy
   npm run build:shared
   ```
3. Start services:
   - Python AI Service (`127.0.0.1:8000`): `.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
   - Express API Gateway (`http://localhost:5000`): `npm --workspace=backend run build && node backend/dist/server.js`
   - Next.js Web App (`http://localhost:3000`): `npm --workspace=frontend run dev` (or `npm --workspace=frontend run build && npm --workspace=frontend run start`)

Alternatively run the containerized stack via `docker compose up --build`.
