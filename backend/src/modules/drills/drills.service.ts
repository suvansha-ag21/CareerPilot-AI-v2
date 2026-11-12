import { FlashcardDrillDTO, GenerateDrillsInput } from "@careerpilot/shared";
import { FlashcardDrill } from "../../../../node_modules/.prisma/client";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";
import { NotFoundError } from "../../utils/errors";

function mapDrillDto(row: FlashcardDrill): FlashcardDrillDTO {
  return {
    id: row.id,
    userId: row.userId,
    topic: row.topic,
    question: row.question,
    hint: row.hint,
    modelAnswer: row.modelAnswer,
    source: row.source,
    easeFactor: Math.round(row.easeFactor * 100) / 100,
    intervalDays: row.intervalDays,
    repetitions: row.repetitions,
    nextReviewAt: row.nextReviewAt.toISOString(),
    lastReviewedAt: row.lastReviewedAt ? row.lastReviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Computes next SM-2 spaced-repetition schedule for a recall rating in [1..4]
 * (1 = Again, 2 = Hard, 3 = Good, 4 = Easy).
 */
export function computeSm2Schedule(params: {
  rating: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  now?: Date;
}): {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
} {
  const { rating } = params;
  const quality = rating === 1 ? 1 : rating === 2 ? 3 : rating === 3 ? 4 : 5;

  let nextEase =
    params.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  nextEase = Math.max(1.3, Math.min(3.0, Math.round(nextEase * 100) / 100));

  let nextReps = params.repetitions;
  let nextInterval = params.intervalDays;

  if (rating === 1) {
    nextReps = 0;
    nextInterval = 1;
  } else {
    nextReps += 1;
    if (nextReps === 1) {
      nextInterval = rating === 4 ? 3 : 1;
    } else if (nextReps === 2) {
      nextInterval = rating === 2 ? 3 : 6;
    } else {
      const mult = rating === 2 ? 1.2 : rating === 4 ? nextEase * 1.25 : nextEase;
      nextInterval = Math.max(1, Math.round(params.intervalDays * mult));
    }
  }

  const base = params.now ?? new Date();
  const nextReviewAt = new Date(base.getTime() + nextInterval * 24 * 60 * 60 * 1000);
  return {
    easeFactor: nextEase,
    intervalDays: nextInterval,
    repetitions: nextReps,
    nextReviewAt,
  };
}

export class DrillsService {
  async listDrills(userId: string): Promise<FlashcardDrillDTO[]> {
    const rows = await prisma.flashcardDrill.findMany({
      where: { userId },
      orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(mapDrillDto);
  }

  async generateDrills(userId: string, input: GenerateDrillsInput): Promise<FlashcardDrillDTO[]> {
    const [user, completedInterviews, recentMatches] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { targetRole: true } }),
      prisma.interview.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 5,
        select: { feedbackSummary: true },
      }),
      prisma.jobMatch.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { missingSkills: true },
      }),
    ]);

    let topics = input.topics ?? [];
    let sourceTag = "CUSTOM";

    if (topics.length === 0) {
      const autoTopics = new Set<string>();
      for (const iv of completedInterviews) {
        const fs = iv.feedbackSummary as { weakTopics?: string[] } | null;
        for (const t of fs?.weakTopics ?? []) autoTopics.add(t);
      }
      for (const m of recentMatches) {
        for (const s of m.missingSkills.slice(0, 3)) autoTopics.add(s);
      }
      topics = Array.from(autoTopics).slice(0, 8);
      if (topics.length > 0) sourceTag = "WEAK_TOPICS";
    }

    const aiRes = await aiServiceClient.generateFlashcardDrills({
      userId,
      targetRole: input.targetRole || user?.targetRole || "Full Stack Developer",
      topics,
      count: input.count ?? 6,
    });

    const createdRows = await prisma.$transaction(
      aiRes.drills.map((d) =>
        prisma.flashcardDrill.create({
          data: {
            userId,
            topic: d.topic,
            question: d.question,
            hint: d.hint,
            modelAnswer: d.model_answer,
            source: sourceTag,
          },
        })
      )
    );

    return createdRows.map(mapDrillDto);
  }

  async reviewDrill(
    userId: string,
    id: string,
    rating: number
  ): Promise<FlashcardDrillDTO> {
    const existing = await prisma.flashcardDrill.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Flashcard drill not found");
    }

    const now = new Date();
    const sched = computeSm2Schedule({
      rating,
      easeFactor: existing.easeFactor,
      intervalDays: existing.intervalDays,
      repetitions: existing.repetitions,
      now,
    });

    const updated = await prisma.flashcardDrill.update({
      where: { id: existing.id },
      data: {
        easeFactor: sched.easeFactor,
        intervalDays: sched.intervalDays,
        repetitions: sched.repetitions,
        nextReviewAt: sched.nextReviewAt,
        lastReviewedAt: now,
      },
    });

    return mapDrillDto(updated);
  }

  async deleteDrill(userId: string, id: string): Promise<void> {
    const existing = await prisma.flashcardDrill.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Flashcard drill not found");
    }
    await prisma.flashcardDrill.delete({ where: { id: existing.id } });
  }
}

export const drillsService = new DrillsService();
