import {
  AnalyzeSkillGapInput,
  CurrentCandidateSkillDTO,
  ProficiencyLevel,
  SkillCategory,
  SkillGapReportDTO,
  SkillSource,
  UpsertUserSkillInput,
} from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";
import { NotFoundError } from "../../utils/errors";

const CONFIDENCE_BY_LEVEL: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.BEGINNER]: 35,
  [ProficiencyLevel.INTERMEDIATE]: 65,
  [ProficiencyLevel.ADVANCED]: 90,
};

const NORMALIZED_ALIAS_MAP: Record<string, string> = {
  "data structures & algorithms": "dsa",
  "data structures and algorithms": "dsa",
  "object-oriented programming": "oop",
  "object oriented programming": "oop",
  postgres: "postgresql",
  reactjs: "react",
  nextjs: "next.js",
  nodejs: "node.js",
  expressjs: "express.js",
  sklearn: "scikit-learn",
  "rest api": "rest apis",
};

function canonicalNormalizedKey(rawName: string): string {
  const lower = rawName.trim().toLowerCase();
  return NORMALIZED_ALIAS_MAP[lower] || lower;
}

export class SkillsService {
  async getSkillInventory(userId: string) {
    const [userSkillsRows, catalogRows] = await Promise.all([
      prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true },
        orderBy: [{ confidenceScore: "desc" }, { skill: { name: "asc" } }],
      }),
      prisma.skill.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
    ]);

    const userSkills: CurrentCandidateSkillDTO[] = userSkillsRows.map((row) => ({
      id: row.id,
      skillId: row.skillId,
      name: row.skill.name,
      normalizedName: row.skill.normalizedName,
      category: row.skill.category as SkillCategory,
      proficiencyLevel: row.proficiencyLevel as ProficiencyLevel,
      source: row.source as SkillSource,
      confidenceScore: row.confidenceScore,
    }));

    return {
      userSkills,
      catalog: catalogRows.map((c) => ({
        id: c.id,
        name: c.name,
        normalizedName: c.normalizedName,
        category: c.category as SkillCategory,
      })),
    };
  }

  async upsertUserSkill(
    userId: string,
    input: UpsertUserSkillInput
  ): Promise<CurrentCandidateSkillDTO> {
    const cleanName = input.name.trim();
    const normKey = canonicalNormalizedKey(cleanName);

    let skillRecord = await prisma.skill.findFirst({
      where: {
        OR: [
          { normalizedName: normKey },
          { normalizedName: cleanName.toLowerCase() },
          { name: { equals: cleanName, mode: "insensitive" } },
        ],
      },
    });

    if (!skillRecord) {
      skillRecord = await prisma.skill.create({
        data: {
          name: cleanName,
          normalizedName: normKey,
          category: input.category,
        },
      });
    }

    const row = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId,
          skillId: skillRecord.id,
        },
      },
      update: {
        proficiencyLevel: input.proficiencyLevel,
        confidenceScore: CONFIDENCE_BY_LEVEL[input.proficiencyLevel],
        source: "PROFILE",
      },
      create: {
        userId,
        skillId: skillRecord.id,
        proficiencyLevel: input.proficiencyLevel,
        confidenceScore: CONFIDENCE_BY_LEVEL[input.proficiencyLevel],
        source: "PROFILE",
      },
      include: { skill: true },
    });

    return {
      id: row.id,
      skillId: row.skillId,
      name: row.skill.name,
      normalizedName: row.skill.normalizedName,
      category: row.skill.category as SkillCategory,
      proficiencyLevel: row.proficiencyLevel as ProficiencyLevel,
      source: row.source as SkillSource,
      confidenceScore: row.confidenceScore,
    };
  }

  async removeUserSkill(userId: string, userSkillId: string): Promise<{ deleted: boolean }> {
    const res = await prisma.userSkill.deleteMany({
      where: { id: userSkillId, userId },
    });
    if (res.count === 0) {
      throw new NotFoundError("Candidate skill entry not found");
    }
    return { deleted: true };
  }

  async analyzeSkillGap(userId: string, input: AnalyzeSkillGapInput): Promise<SkillGapReportDTO> {
    const [user, inventory, resume, jobMatch] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { targetRole: true },
      }),
      this.getSkillInventory(userId),
      input.resumeId
        ? prisma.resume.findFirst({
            where: { id: input.resumeId, userId },
            select: { id: true, title: true, skills: true, extractedText: true },
          })
        : prisma.resume.findFirst({
            where: { userId, extractedText: { not: "" } },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
            select: { id: true, title: true, skills: true, extractedText: true },
          }),
      input.jobMatchId
        ? prisma.jobMatch.findFirst({
            where: { id: input.jobMatchId, userId },
            select: {
              id: true,
              targetRole: true,
              missingSkills: true,
              partialSkills: true,
            },
          })
        : prisma.jobMatch.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              targetRole: true,
              missingSkills: true,
              partialSkills: true,
            },
          }),
    ]);

    if (!user) {
      throw new NotFoundError("Candidate user not found");
    }
    if (input.resumeId && !resume) {
      throw new NotFoundError("Selected resume not found");
    }
    if (input.jobMatchId && !jobMatch) {
      throw new NotFoundError("Selected job match record not found");
    }

    const effectiveRole = input.targetRole || jobMatch?.targetRole || user.targetRole;

    const aiReport = await aiServiceClient.analyzeSkillGap({
      targetRole: effectiveRole,
      learningPreference: input.learningPreference,
      currentSkills: inventory.userSkills,
      resumeSkills: resume?.skills ?? [],
      resumeSummary: resume?.extractedText ? resume.extractedText.slice(0, 1500) : null,
      jobMatchRole: jobMatch?.targetRole ?? null,
      jobMatchMissingSkills: jobMatch?.missingSkills ?? [],
      jobMatchPartialSkills: jobMatch?.partialSkills ?? [],
    });

    return {
      ...aiReport,
      currentSkills: inventory.userSkills,
      evaluatedFrom: {
        resumeTitle: resume?.title ?? null,
        jobMatchRole: jobMatch?.targetRole ?? null,
        profileSkillsCount: inventory.userSkills.length,
      },
    };
  }
}

export const skillsService = new SkillsService();
