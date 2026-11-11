import {
  InterviewCategory,
  InterviewCriteriaScoresDTO,
  InterviewDifficulty,
  InterviewFeedbackSummaryDTO,
  InterviewMode,
  InterviewQuestionDTO,
  InterviewSessionDTO,
  InterviewStatus,
  StartInterviewInput,
  SubmitInterviewAnswerInput,
} from "@careerpilot/shared";
import { Prisma } from "../../../../node_modules/.prisma/client";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";
import { BadRequestError, NotFoundError } from "../../utils/errors";

type InterviewWithQuestions = Prisma.InterviewGetPayload<{
  include: { questions: true };
}>;

function mapInterviewToDTO(row: InterviewWithQuestions): InterviewSessionDTO {
  const sorted = [...row.questions].sort((a, b) => a.questionOrder - b.questionOrder);

  const questions: InterviewQuestionDTO[] = sorted.map((q) => ({
    id: q.id,
    interviewId: q.interviewId,
    questionOrder: q.questionOrder,
    question: q.question,
    topicTag: q.topicTag,
    userAnswer: q.userAnswer,
    modelAnswer: q.modelAnswer,
    score: q.score !== null ? Math.round(q.score * 10) / 10 : null,
    criteriaScores: q.criteriaScores as unknown as InterviewCriteriaScoresDTO | null,
    feedback: q.feedback,
    isFollowUp: q.isFollowUp,
    createdAt: q.createdAt.toISOString(),
    answeredAt: q.answeredAt ? q.answeredAt.toISOString() : null,
  }));

  const answeredCount = questions.filter((q) => q.userAnswer !== null).length;

  return {
    id: row.id,
    userId: row.userId,
    resumeId: row.resumeId,
    category: row.category as InterviewCategory,
    difficulty: row.difficulty as InterviewDifficulty,
    mode: row.mode as InterviewMode,
    durationMinutes: row.durationMinutes,
    questionLimit: row.questionLimit,
    targetJobDescription: row.targetJobDescription,
    status: row.status as InterviewStatus,
    overallScore: row.overallScore !== null ? Math.round(row.overallScore * 10) / 10 : null,
    feedbackSummary: row.feedbackSummary as unknown as InterviewFeedbackSummaryDTO | null,
    answeredCount,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    questions,
  };
}

export class InterviewsService {
  async listInterviews(userId: string): Promise<InterviewSessionDTO[]> {
    const rows = await prisma.interview.findMany({
      where: { userId },
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapInterviewToDTO);
  }

  async getInterviewById(userId: string, id: string): Promise<InterviewSessionDTO> {
    const row = await prisma.interview.findFirst({
      where: { id, userId },
      include: { questions: true },
    });

    if (!row) {
      throw new NotFoundError("Interview session not found");
    }

    return mapInterviewToDTO(row);
  }

  async startInterview(
    userId: string,
    input: StartInterviewInput
  ): Promise<InterviewSessionDTO> {
    const [user, resume] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          projects: true,
          skills: { include: { skill: true } },
        },
      }),
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
    ]);

    if (!user) {
      throw new NotFoundError("Candidate profile not found");
    }
    if (input.resumeId && !resume) {
      throw new NotFoundError("Selected resume not found");
    }

    const projectsSummary =
      user.projects
        .map((p) => `${p.title} [${p.techStack.join(", ")}]: ${p.description}`)
        .join(" | ") || null;
    const skillsList = user.skills.map((us) => us.skill.name);

    const opening = await aiServiceClient.startInterviewQuestion({
      userId,
      category: input.category,
      difficulty: input.difficulty,
      targetRole: user.targetRole,
      yearsExperience: user.yearsExperience,
      resumeId: resume?.id ?? null,
      resumeSummary: resume?.extractedText ? resume.extractedText.slice(0, 1500) : null,
      projectsSummary,
      skillsList,
      targetJobDescription: input.targetJobDescription ?? null,
    });

    const created = await prisma.interview.create({
      data: {
        userId,
        resumeId: resume?.id ?? null,
        category: input.category,
        difficulty: input.difficulty,
        mode: input.mode,
        durationMinutes: input.durationMinutes,
        questionLimit: input.questionLimit,
        targetJobDescription: input.targetJobDescription ?? null,
        status: "IN_PROGRESS",
        questions: {
          create: {
            questionOrder: 1,
            question: opening.question,
            topicTag: opening.topicTag,
            modelAnswer: opening.modelAnswer,
            isFollowUp: false,
          },
        },
      },
      include: { questions: true },
    });

    return mapInterviewToDTO(created);
  }

  private async finalizeReport(params: {
    interviewId: string;
    category: InterviewCategory;
    difficulty: InterviewDifficulty;
    targetRole: string;
  }): Promise<InterviewSessionDTO> {
    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId: params.interviewId, userAnswer: { not: null } },
      orderBy: { questionOrder: "asc" },
    });

    if (questions.length === 0) {
      const updated = await prisma.interview.update({
        where: { id: params.interviewId },
        data: {
          status: "ABANDONED",
          completedAt: new Date(),
        },
        include: { questions: true },
      });
      return mapInterviewToDTO(updated);
    }

    const summary = await aiServiceClient.summarizeInterview({
      category: params.category,
      difficulty: params.difficulty,
      targetRole: params.targetRole,
      answeredQuestions: questions.map((q) => ({
        question: q.question,
        topicTag: q.topicTag,
        userAnswer: q.userAnswer || "",
        score: q.score ?? 0,
        criteriaScores: (q.criteriaScores as unknown as InterviewCriteriaScoresDTO) ?? {
          technicalAccuracy: q.score ?? 0,
          depthOfUnderstanding: q.score ?? 0,
          completeness: q.score ?? 0,
          clarityAndStructure: q.score ?? 0,
          practicalExamples: q.score ?? 0,
        },
        feedback: q.feedback || "",
      })),
    });

    const completed = await prisma.interview.update({
      where: { id: params.interviewId },
      data: {
        status: "COMPLETED",
        overallScore: summary.overallScore,
        feedbackSummary: summary.feedbackSummary as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
      include: { questions: true },
    });

    return mapInterviewToDTO(completed);
  }

  async submitAnswer(
    userId: string,
    interviewId: string,
    input: SubmitInterviewAnswerInput
  ): Promise<InterviewSessionDTO> {
    const [user, interview] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { targetRole: true } }),
      prisma.interview.findFirst({
        where: { id: interviewId, userId },
        include: {
          resume: { select: { extractedText: true } },
          questions: { orderBy: { questionOrder: "asc" } },
        },
      }),
    ]);

    if (!user || !interview) {
      throw new NotFoundError("Interview session not found");
    }
    if (interview.status !== "IN_PROGRESS") {
      throw new BadRequestError("This interview session has already finished.");
    }

    const targetQ = interview.questions.find((q) => q.id === input.questionId);
    if (!targetQ) {
      throw new NotFoundError("Interview question not found in this session.");
    }
    if (targetQ.userAnswer !== null) {
      throw new BadRequestError("This question has already been answered.");
    }

    const priorAnswered = interview.questions.filter(
      (q) => q.userAnswer !== null && q.id !== targetQ.id
    );
    const totalAnsweredAfterThis = priorAnswered.length + 1;
    const remainingQuestions = Math.max(0, interview.questionLimit - totalAnsweredAfterThis);

    const evalRes = await aiServiceClient.evaluateAnswerAndNext({
      userId,
      category: interview.category as InterviewCategory,
      difficulty: interview.difficulty as InterviewDifficulty,
      targetRole: user.targetRole,
      currentQuestion: targetQ.question,
      currentTopicTag: targetQ.topicTag,
      currentModelAnswer: targetQ.modelAnswer,
      currentIsFollowUp: targetQ.isFollowUp,
      userAnswer: input.answerText,
      remainingQuestions,
      previousQa: priorAnswered.map((q) => ({
        question: q.question,
        topicTag: q.topicTag,
        userAnswer: q.userAnswer,
        score: q.score,
        isFollowUp: q.isFollowUp,
      })),
      resumeId: interview.resumeId,
      resumeSummary: interview.resume?.extractedText
        ? interview.resume.extractedText.slice(0, 1200)
        : null,
      targetJobDescription: interview.targetJobDescription,
    });

    await prisma.$transaction(async (tx) => {
      await tx.interviewQuestion.update({
        where: { id: targetQ.id },
        data: {
          userAnswer: input.answerText,
          score: evalRes.score,
          criteriaScores: evalRes.criteriaScores as unknown as Prisma.InputJsonValue,
          feedback: evalRes.feedback,
          answeredAt: new Date(),
        },
      });

      if (remainingQuestions > 0 && evalRes.nextQuestion) {
        const nextOrder =
          Math.max(...interview.questions.map((q) => q.questionOrder), 0) + 1;
        await tx.interviewQuestion.create({
          data: {
            interviewId: interview.id,
            questionOrder: nextOrder,
            question: evalRes.nextQuestion.question,
            topicTag: evalRes.nextQuestion.topicTag,
            modelAnswer: evalRes.nextQuestion.modelAnswer,
            isFollowUp: evalRes.nextQuestion.isFollowUp,
          },
        });
      }
    });

    if (remainingQuestions === 0) {
      return this.finalizeReport({
        interviewId: interview.id,
        category: interview.category as InterviewCategory,
        difficulty: interview.difficulty as InterviewDifficulty,
        targetRole: user.targetRole,
      });
    }

    return this.getInterviewById(userId, interview.id);
  }

  async completeInterview(userId: string, interviewId: string): Promise<InterviewSessionDTO> {
    const [user, interview] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { targetRole: true } }),
      prisma.interview.findFirst({ where: { id: interviewId, userId } }),
    ]);

    if (!user || !interview) {
      throw new NotFoundError("Interview session not found");
    }
    if (interview.status !== "IN_PROGRESS") {
      return this.getInterviewById(userId, interview.id);
    }

    return this.finalizeReport({
      interviewId: interview.id,
      category: interview.category as InterviewCategory,
      difficulty: interview.difficulty as InterviewDifficulty,
      targetRole: user.targetRole,
    });
  }

  async deleteInterview(userId: string, interviewId: string): Promise<{ deleted: boolean }> {
    const res = await prisma.interview.deleteMany({
      where: { id: interviewId, userId },
    });
    if (res.count === 0) {
      throw new NotFoundError("Interview session not found");
    }
    return { deleted: true };
  }
}

export const interviewsService = new InterviewsService();
