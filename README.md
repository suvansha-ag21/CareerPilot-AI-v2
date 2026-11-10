# CareerPilot AI – AI-Powered Career & Interview Intelligence Platform

A modular, production-grade SaaS platform combining a **Next.js (TypeScript)** workspace, an **Express.js (TypeScript)** API gateway backed by **PostgreSQL + Prisma**, and an isolated **Python + FastAPI** AI/ML microservice with **ChromaDB** vector search, **Scikit-learn** scoring, **Sentence Transformers**, and **LangChain**.

## Architecture Overview
- **Frontend (`frontend/`)**: Next.js App Router, Tailwind CSS, Recharts, Lucide React (`#111827` dark sidebar + `#F8FAFC` workspace + `#6D5DFB` primary accent).
- **API Gateway (`backend-node/`)**: Express + TypeScript, JWT Access + rotated `HttpOnly` Refresh tokens, Zod validation, Prisma ORM.
- **AI Microservice (`ai-service/`)**: FastAPI, Sentence Transformers, Scikit-learn, ChromaDB RAG, LangChain LLM orchestration, Voice STT/TTS pipeline.
- **Database (`database/`)**: PostgreSQL schema, SQL migrations, and persistent ChromaDB store.
- **Shared (`shared/`)**: TypeScript interfaces, enums, and Zod validation schemas shared between Frontend and Node Gateway.

## Development Phases
- **Phase 1**: Project setup, architecture, JWT authentication, user profile & dashboard shell *(Active)*
- **Phase 2**: Resume parsing & AI Resume Analyzer
- **Phase 3**: Job Description Matcher & Skill Gap Analyzer
- **Phase 4**: AI Mock Interview & Voice Interview
- **Phase 5**: Personalized Learning Roadmap
- **Phase 6**: Job Application Tracker & Analytics Dashboard
- **Phase 7**: Testing, optimization, security & deployment
