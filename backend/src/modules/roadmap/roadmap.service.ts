import {
  GenerateRoadmapInput,
  LearningResourceDTO,
  LearningRoadmapDTO,
  ProficiencyLevel,
  RoadmapTaskDTO,
  SkillCategory,
  TaskPriority,
  TaskStatus,
  UpdateRoadmapTaskInput,
} from "@careerpilot/shared";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";
import { NotFoundError } from "../../utils/errors";
import { skillsService } from "../skills/skills.service";

type RoadmapWithTasks = Prisma.LearningRoadmapGetPayload<{
  include: { tasks: true };
}>;

function mapRoadmapToDTO(row: RoadmapWithTasks): LearningRoadmapDTO {
  const sortedTasks = [...row.tasks].sort(
    (a, b) => a.weekNumber - b.weekNumber || a.dayNumber - b.dayNumber
  );

  const tasks: RoadmapTaskDTO[] = sortedTasks.map((t) => ({
    id: t.id,
    roadmapId: t.roadmapId,
    weekNumber: t.weekNumber,
    dayNumber: t.dayNumber,
    title: t.title,
    description: t.description,
    skillTag: t.skillTag,
    priority: t.priority as TaskPriority,
    resources: Array.isArray(t.resources)
      ? (t.resources as unknown as LearningResourceDTO[])
      : [],
    status: t.status as TaskStatus,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
  }));

  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;

  return {
    id: row.id,
    userId: row.userId,
    targetRole: row.targetRole,
    title: row.title,
    estimatedWeeks: row.estimatedWeeks,
    progressPct: Math.round(row.progressPct * 10) / 10,
    isActive: row.isActive,
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tasks,
  };
}

export class RoadmapService {
  async listRoadmaps(userId: string): Promise<LearningRoadmapDTO[]> {
    const rows = await prisma.learningRoadmap.findMany({
      where: { userId },
      include: { tasks: true },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });

    return rows.map(mapRoadmapToDTO);
  }

  async getRoadmapById(userId: string, id: string): Promise<LearningRoadmapDTO> {
    const row = await prisma.learningRoadmap.findFirst({
      where: { id, userId },
      include: { tasks: true },
    });

    if (!row) {
      throw new NotFoundError("Learning roadmap not found");
    }

    return mapRoadmapToDTO(row);
  }

  async generateRoadmap(
    userId: string,
    input: GenerateRoadmapInput
  ): Promise<LearningRoadmapDTO> {
    const [user, resume, gapReport] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { targetRole: true } }),
      input.resumeId
        ? prisma.resume.findFirst({
            where: { id: input.resumeId, userId },
            select: { id: true, extractedText: true },
          })
        : prisma.resume.findFirst({
            where: { userId, extractedText: { not: "" } },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
            select: { id: true, extractedText: true },
          }),
      skillsService.analyzeSkillGap(userId, {
        targetRole: input.targetRole,
        resumeId: input.resumeId,
        jobMatchId: input.jobMatchId,
      }),
    ]);

    if (!user) {
      throw new NotFoundError("Candidate user not found");
    }

    const effectiveRole = input.targetRole || gapReport.targetRole || user.targetRole;

    let skillGaps = gapReport.missingSkills;
    let learningOrder = gapReport.learningOrder;

    if (input.focusSkills && input.focusSkills.length > 0) {
      const normalizedFocus = new Set(input.focusSkills.map((s) => s.trim().toLowerCase()));
      const matchedBenchmarks = gapReport.benchmarks.filter((b) =>
        normalizedFocus.has(b.skill.toLowerCase())
      );
      if (matchedBenchmarks.length > 0) {
        skillGaps = matchedBenchmarks;
        learningOrder = input.focusSkills;
      } else {
        skillGaps = input.focusSkills.map((s) => ({
          skill: s,
          category: SkillCategory.CORE_CS,
          importance: "CRITICAL" as const,
          requiredLevel: ProficiencyLevel.INTERMEDIATE,
          currentLevel: null,
          confidenceScore: 0,
          status: "MISSING" as const,
          source: null,
          prerequisites: [],
          recommendedAction: `Build proficiency in ${s} through structured exercises and a mini project.`,
          resources: [],
        }));
        learningOrder = input.focusSkills;
      }
    }

    const generated = await aiServiceClient.generateRoadmap({
      targetRole: effectiveRole,
      estimatedWeeks: input.estimatedWeeks,
      hoursPerWeek: input.hoursPerWeek,
      skillGaps,
      learningOrder,
      currentSkillNames: gapReport.currentSkills.map((s) => s.name),
      resumeSummary: resume?.extractedText ? resume.extractedText.slice(0, 1200) : null,
    });

    const baseDate = new Date();
    const created = await prisma.$transaction(async (tx) => {
      await tx.learningRoadmap.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      const roadmap = await tx.learningRoadmap.create({
        data: {
          userId,
          targetRole: effectiveRole,
          title: generated.title,
          estimatedWeeks: generated.estimatedWeeks,
          progressPct: 0,
          isActive: true,
          tasks: {
            create: generated.tasks.map((t) => {
              const due = new Date(baseDate.getTime());
              due.setDate(due.getDate() + t.dueDateOffsetDays);
              return {
                weekNumber: t.weekNumber,
                dayNumber: t.dayNumber,
                title: t.title,
                description: t.description,
                skillTag: t.skillTag,
                priority: t.priority,
                resources: t.resources as unknown as Prisma.InputJsonValue,
                status: "PENDING",
                dueDate: due,
              };
            }),
          },
        },
        include: { tasks: true },
      });

      return roadmap;
    });

    return mapRoadmapToDTO(created);
  }

  async updateTask(
    userId: string,
    roadmapId: string,
    taskId: string,
    input: UpdateRoadmapTaskInput
  ): Promise<LearningRoadmapDTO> {
    const roadmap = await prisma.learningRoadmap.findFirst({
      where: { id: roadmapId, userId },
      include: { tasks: true },
    });

    if (!roadmap) {
      throw new NotFoundError("Learning roadmap not found");
    }

    const existingTask = roadmap.tasks.find((t) => t.id === taskId);
    if (!existingTask) {
      throw new NotFoundError("Roadmap task not found");
    }

    const updatedRoadmap = await prisma.$transaction(async (tx) => {
      await tx.roadmapTask.update({
        where: { id: taskId },
        data: {
          ...(input.status !== undefined
            ? {
                status: input.status,
                completedAt: input.status === TaskStatus.COMPLETED ? new Date() : null,
              }
            : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
        },
      });

      const allTasks = await tx.roadmapTask.findMany({ where: { roadmapId } });
      const completedCount = allTasks.filter((t) => t.status === "COMPLETED").length;
      const progressPct =
        allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 1000) / 10 : 0;

      return tx.learningRoadmap.update({
        where: { id: roadmapId },
        data: { progressPct },
        include: { tasks: true },
      });
    });

    return mapRoadmapToDTO(updatedRoadmap);
  }

  async activateRoadmap(userId: string, roadmapId: string): Promise<LearningRoadmapDTO> {
    const existing = await prisma.learningRoadmap.findFirst({
      where: { id: roadmapId, userId },
    });
    if (!existing) {
      throw new NotFoundError("Learning roadmap not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.learningRoadmap.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      return tx.learningRoadmap.update({
        where: { id: roadmapId },
        data: { isActive: true },
        include: { tasks: true },
      });
    });

    return mapRoadmapToDTO(updated);
  }

  async deleteRoadmap(userId: string, roadmapId: string): Promise<{ deleted: boolean }> {
    const deleted = await prisma.$transaction(async (tx) => {
      const target = await tx.learningRoadmap.findFirst({
        where: { id: roadmapId, userId },
      });
      if (!target) {
        throw new NotFoundError("Learning roadmap not found");
      }

      await tx.learningRoadmap.delete({ where: { id: roadmapId } });

      // Promote latest remaining roadmap cleanly if user deleted their active plan
      if (target.isActive) {
        const nextLatest = await tx.learningRoadmap.findFirst({
          where: { userId },
          orderBy: { updatedAt: "desc" },
        });
        if (nextLatest) {
          await tx.learningRoadmap.update({
            where: { id: nextLatest.id },
            data: { isActive: true },
          });
        }
      }

      return true;
    });

    return { deleted };
  }
}

export const roadmapService = new RoadmapService();
