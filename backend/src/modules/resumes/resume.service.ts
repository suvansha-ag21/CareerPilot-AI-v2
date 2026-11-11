import path from "path";
import {
  AnalyzeResumeOptionsInput,
  ParsedResumeDataDTO,
  ResumeDTO,
  ResumeFeedbackReportDTO,
  ResumeSectionEvaluationDTO,
} from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";
import { storageProvider } from "../../services/storage.service";
import { validateResumeBinary } from "../../utils/fileValidation";
import { BadRequestError, NotFoundError } from "../../utils/errors";

const EMPTY_PARSED_DATA: ParsedResumeDataDTO = {
  contact: {
    candidateName: null,
    email: null,
    phone: null,
    location: null,
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
  },
  summary: null,
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  sectionsDetected: [],
  wordCount: 0,
};

const EMPTY_FEEDBACK: ResumeFeedbackReportDTO = {
  scoringMethodologyNote:
    "Estimated platform compatibility score based on CareerPilot AI structural, keyword, and impact criteria. Not a universal ATS score.",
  strengths: [],
  weaknesses: [],
  missingKeywords: [],
  missingSections: [],
  unnecessaryInfo: [],
  formattingSuggestions: [],
  summarySuggestion: "",
  bulletSuggestions: [],
};

function mapResumeDto(record: {
  id: string;
  userId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  extractedText: string;
  parsedData: unknown;
  skills: string[];
  estimatedScore: number;
  sectionScores: unknown;
  feedback: unknown;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ResumeDTO {
  const isAnalyzed = record.extractedText.trim().length > 0;
  return {
    id: record.id,
    userId: record.userId,
    title: record.title,
    fileUrl: record.fileUrl,
    fileType: record.fileType as "PDF" | "DOCX",
    extractedText: record.extractedText,
    parsedData: (record.parsedData as ParsedResumeDataDTO) || EMPTY_PARSED_DATA,
    skills: record.skills,
    estimatedScore: record.estimatedScore,
    sectionScores: (record.sectionScores as ResumeSectionEvaluationDTO[]) || [],
    feedback: (record.feedback as ResumeFeedbackReportDTO) || EMPTY_FEEDBACK,
    isPrimary: record.isPrimary,
    analyzedAt: isAnalyzed ? record.updatedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class ResumeService {
  async uploadResume(params: {
    userId: string;
    fileBuffer: Buffer;
    originalName: string;
    mimeType: string;
    customTitle?: string;
  }): Promise<ResumeDTO> {
    const fileType = validateResumeBinary(params.fileBuffer, params.originalName, params.mimeType);
    const title =
      params.customTitle?.trim() ||
      path.basename(params.originalName, path.extname(params.originalName)).slice(0, 120) ||
      "Uploaded Resume";

    const stored = await storageProvider.saveResume(
      params.userId,
      params.originalName,
      params.fileBuffer,
      params.mimeType
    );

    const existingCount = await prisma.resume.count({ where: { userId: params.userId } });

    const created = await prisma.resume.create({
      data: {
        userId: params.userId,
        title,
        fileUrl: stored.storageKey,
        fileType,
        extractedText: "",
        parsedData: EMPTY_PARSED_DATA as unknown as object,
        skills: [],
        estimatedScore: 0,
        sectionScores: [] as unknown as object,
        feedback: EMPTY_FEEDBACK as unknown as object,
        isPrimary: existingCount === 0,
      },
    });

    return mapResumeDto(created);
  }

  async analyzeResume(
    userId: string,
    resumeId: string,
    options?: AnalyzeResumeOptionsInput
  ): Promise<ResumeDTO> {
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!existing) {
      throw new NotFoundError("Resume not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetRole: true, careerPreferences: true },
    });
    const prefs = (user?.careerPreferences as Record<string, unknown> | null) ?? {};

    const buffer = await storageProvider.readResumeBuffer(existing.fileUrl);
    const ext = existing.fileType === "DOCX" ? ".docx" : ".pdf";

    const aiResult = await aiServiceClient.parseAndEvaluateResume({
      userId,
      resumeId,
      targetRole: options?.targetRole || user?.targetRole || "Full Stack Developer",
      experienceLevel:
        options?.experienceLevel ||
        (typeof prefs.experienceLevel === "string" ? prefs.experienceLevel : "Fresher"),
      analysisType: options?.analysisType || "COMPLETE_ANALYSIS",
      filename: `${existing.title}${ext}`,
      fileType: existing.fileType,
      fileBuffer: buffer,
    });

    const updated = await prisma.resume.update({
      where: { id: existing.id },
      data: {
        extractedText: aiResult.extractedText,
        parsedData: aiResult.parsedData as unknown as object,
        skills: aiResult.skills,
        estimatedScore: aiResult.estimatedScore,
        sectionScores: aiResult.sectionScores as unknown as object,
        feedback: aiResult.feedback as unknown as object,
      },
    });

    return mapResumeDto(updated);
  }

  async listResumes(userId: string): Promise<ResumeDTO[]> {
    const records = await prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return records.map(mapResumeDto);
  }

  async getResumeById(userId: string, resumeId: string): Promise<ResumeDTO> {
    const record = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!record) {
      throw new NotFoundError("Resume not found");
    }
    return mapResumeDto(record);
  }

  async getResumeBinary(
    userId: string,
    resumeId: string
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const record = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!record) {
      throw new NotFoundError("Resume not found");
    }

    const buffer = await storageProvider.readResumeBuffer(record.fileUrl);
    const mimeType =
      record.fileType === "DOCX"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf";
    const ext = record.fileType === "DOCX" ? "docx" : "pdf";
    const safeTitle = record.title.replace(/[^a-zA-Z0-9._-]/g, "_") || "resume";

    return { buffer, mimeType, filename: `${safeTitle}.${ext}` };
  }

  async setPrimaryResume(userId: string, resumeId: string): Promise<ResumeDTO> {
    const target = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!target) {
      throw new NotFoundError("Resume not found");
    }

    const [, updated] = await prisma.$transaction([
      prisma.resume.updateMany({ where: { userId }, data: { isPrimary: false } }),
      prisma.resume.update({ where: { id: resumeId }, data: { isPrimary: true } }),
    ]);

    return mapResumeDto(updated);
  }

  async syncDetectedSkillsToProfile(userId: string, resumeId: string): Promise<{ syncedCount: number }> {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!resume) throw new NotFoundError("Resume not found");
    if (resume.skills.length === 0) {
      throw new BadRequestError("Analyze this resume first before syncing detected skills");
    }

    let syncedCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const rawSkill of resume.skills) {
        const clean = rawSkill.trim();
        const norm = clean.toLowerCase();
        if (!norm) continue;

        const skillRow = await tx.skill.upsert({
          where: { normalizedName: norm },
          update: {},
          create: {
            name: clean,
            normalizedName: norm,
            category: "CORE_CS",
          },
        });

        await tx.userSkill.upsert({
          where: { userId_skillId: { userId, skillId: skillRow.id } },
          update: {},
          create: {
            userId,
            skillId: skillRow.id,
            proficiencyLevel: "INTERMEDIATE",
            source: "RESUME_PARSED",
            confidenceScore: 70,
          },
        });
        syncedCount += 1;
      }
    });

    return { syncedCount };
  }

  async deleteResume(userId: string, resumeId: string): Promise<void> {
    const existing = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!existing) {
      throw new NotFoundError("Resume not found");
    }

    await prisma.resume.delete({ where: { id: existing.id } });
    await storageProvider.deleteResume(existing.fileUrl);
    await aiServiceClient.deleteResumeVectors(userId, existing.id);

    // Promote newest remaining resume as primary if needed
    if (existing.isPrimary) {
      const next = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await prisma.resume.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }
  }
}

export const resumeService = new ResumeService();
