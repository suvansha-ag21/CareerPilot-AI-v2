import {
  CreateJobMatchInput,
  JobMatchDTO,
  JobMatchRecommendationsDTO,
  RelevantProjectMatchDTO,
} from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { validateJobDescriptionFile } from "../../utils/fileValidation";

function mapMatchDto(
  row: {
    id: string;
    userId: string;
    resumeId: string;
    targetRole: string;
    companyName: string | null;
    jobDescription: string;
    matchScore: number;
    semanticScore: number;
    skillScore: number;
    experienceScore: number;
    matchingSkills: string[];
    partialSkills: string[];
    missingSkills: string[];
    relevantProjects: unknown;
    recommendations: unknown;
    createdAt: Date;
    resume?: { title: string };
  }
): JobMatchDTO {
  return {
    id: row.id,
    userId: row.userId,
    resumeId: row.resumeId,
    resumeTitle: row.resume?.title,
    targetRole: row.targetRole,
    companyName: row.companyName,
    jobDescription: row.jobDescription,
    matchScore: row.matchScore,
    semanticScore: row.semanticScore,
    skillScore: row.skillScore,
    experienceScore: row.experienceScore,
    matchingSkills: row.matchingSkills,
    partialSkills: row.partialSkills,
    missingSkills: row.missingSkills,
    relevantProjects: (row.relevantProjects as RelevantProjectMatchDTO[]) || [],
    recommendations: row.recommendations as JobMatchRecommendationsDTO,
    createdAt: row.createdAt.toISOString(),
  };
}

export class MatcherService {
  async createJobMatch(params: {
    userId: string;
    input: CreateJobMatchInput;
    file?: { buffer: Buffer; originalname: string; mimetype: string };
  }): Promise<JobMatchDTO> {
    const resume = await prisma.resume.findFirst({
      where: { id: params.input.resumeId, userId: params.userId },
    });

    if (!resume) {
      throw new NotFoundError("Selected resume not found");
    }

    if (!resume.extractedText || resume.extractedText.trim().length < 20) {
      throw new BadRequestError(
        "Please analyze your uploaded resume first in Resume AI before running a Job Description match."
      );
    }

    let verifiedJdFile: { buffer: Buffer; filename: string; mime: string } | undefined;
    if (params.file) {
      const validated = validateJobDescriptionFile(
        params.file.buffer,
        params.file.originalname,
        params.file.mimetype
      );
      verifiedJdFile = {
        buffer: params.file.buffer,
        filename: params.file.originalname,
        mime: validated.mime,
      };
    }

    const jdText = params.input.jobDescription?.trim() || "";
    if (!verifiedJdFile && jdText.length < 40) {
      throw new BadRequestError(
        "Please paste a job description (at least 40 characters) or upload a JD file (.pdf, .docx, .txt)."
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { yearsExperience: true, careerPreferences: true },
    });
    const prefs = (user?.careerPreferences as Record<string, unknown> | null) ?? {};

    const aiRes = await aiServiceClient.evaluateJobMatch({
      userId: params.userId,
      resumeId: resume.id,
      resumeText: resume.extractedText,
      resumeSkills: resume.skills,
      candidateYears: user?.yearsExperience ?? 0,
      jobDescription: jdText || undefined,
      targetRole: params.input.targetRole,
      companyName: params.input.companyName,
      experienceLevel:
        params.input.experienceLevel ||
        (typeof prefs.experienceLevel === "string" ? prefs.experienceLevel : undefined),
      jobType: params.input.jobType,
      jdFile: verifiedJdFile,
    });

    const created = await prisma.jobMatch.create({
      data: {
        userId: params.userId,
        resumeId: resume.id,
        targetRole: aiRes.targetRole,
        companyName: aiRes.companyName,
        jobDescription: aiRes.jobDescriptionText,
        matchScore: aiRes.matchScore,
        semanticScore: aiRes.semanticScore,
        skillScore: aiRes.skillScore,
        experienceScore: aiRes.experienceScore,
        matchingSkills: aiRes.matchingSkills,
        partialSkills: aiRes.partialSkills,
        missingSkills: aiRes.missingSkills,
        relevantProjects: aiRes.relevantProjects as unknown as object,
        recommendations: aiRes.recommendations as unknown as object,
      },
      include: {
        resume: { select: { title: true } },
      },
    });

    return mapMatchDto(created);
  }

  async listJobMatches(userId: string): Promise<JobMatchDTO[]> {
    const rows = await prisma.jobMatch.findMany({
      where: { userId },
      include: { resume: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapMatchDto);
  }

  async getJobMatchById(userId: string, matchId: string): Promise<JobMatchDTO> {
    const row = await prisma.jobMatch.findFirst({
      where: { id: matchId, userId },
      include: { resume: { select: { title: true } } },
    });
    if (!row) {
      throw new NotFoundError("Job compatibility report not found");
    }
    return mapMatchDto(row);
  }

  async deleteJobMatch(userId: string, matchId: string): Promise<void> {
    const existing = await prisma.jobMatch.findFirst({
      where: { id: matchId, userId },
    });
    if (!existing) {
      throw new NotFoundError("Job compatibility report not found");
    }
    await prisma.jobMatch.delete({ where: { id: existing.id } });
  }
}

export const matcherService = new MatcherService();
