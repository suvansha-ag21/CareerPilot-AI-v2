-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'REMOTE', 'ON_SITE', 'HYBRID');

-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'SHORTLISTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InterviewCategory" ADD VALUE 'BEHAVIORAL';
ALTER TYPE "InterviewCategory" ADD VALUE 'MIXED';

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "subcategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetRole" TEXT;

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "jobType" "JobType" NOT NULL DEFAULT 'FULL_TIME';
