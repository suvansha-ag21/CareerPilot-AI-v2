-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "githubRepoId" UUID;

-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "submissionContext" JSONB;

-- CreateTable
CREATE TABLE "GitHubRepoAnalysis" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "description" TEXT,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "primaryLanguage" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "detectedStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "architectureHighlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interviewHooks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepoAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardDrill" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "topic" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "hint" TEXT,
    "modelAnswer" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlashcardDrill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTelemetryLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTelemetryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GitHubRepoAnalysis_userId_updatedAt_idx" ON "GitHubRepoAnalysis"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepoAnalysis_userId_owner_repoName_key" ON "GitHubRepoAnalysis"("userId", "owner", "repoName");

-- CreateIndex
CREATE INDEX "FlashcardDrill_userId_nextReviewAt_idx" ON "FlashcardDrill"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "AiTelemetryLog_createdAt_idx" ON "AiTelemetryLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiTelemetryLog_userId_createdAt_idx" ON "AiTelemetryLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_githubRepoId_fkey" FOREIGN KEY ("githubRepoId") REFERENCES "GitHubRepoAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepoAnalysis" ADD CONSTRAINT "GitHubRepoAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardDrill" ADD CONSTRAINT "FlashcardDrill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTelemetryLog" ADD CONSTRAINT "AiTelemetryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
