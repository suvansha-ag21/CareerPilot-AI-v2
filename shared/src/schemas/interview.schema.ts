import { z } from "zod";
import {
  InterviewCategory,
  InterviewDifficulty,
  InterviewMode,
} from "../constants/enums";

export const SpeechMetricsInputSchema = z.object({
  durationSeconds: z.number().min(0),
  wordCount: z.number().int().min(0),
  wordsPerMinute: z.number().min(0),
  fillerWordCount: z.number().int().min(0),
  fillerWords: z.array(z.string()).default([]),
  deliveryFeedback: z.string(),
});

export const StartInterviewSchema = z.object({
  category: z.nativeEnum(InterviewCategory).default(InterviewCategory.TECHNICAL),
  difficulty: z.nativeEnum(InterviewDifficulty).default(InterviewDifficulty.MEDIUM),
  mode: z.nativeEnum(InterviewMode).default(InterviewMode.TEXT),
  durationMinutes: z.coerce.number().int().min(5).max(90).default(20),
  questionLimit: z.coerce.number().int().min(3).max(10).default(5),
  resumeId: z.string().uuid().optional(),
  targetJobDescription: z.string().trim().max(15000).optional(),
});

export const SubmitInterviewAnswerSchema = z.object({
  questionId: z.string().uuid("Valid questionId is required"),
  answerText: z
    .string()
    .trim()
    .min(5, "Please provide a meaningful answer (at least 5 characters)")
    .max(12000),
  speechMetrics: SpeechMetricsInputSchema.optional(),
});

export type StartInterviewInput = z.infer<typeof StartInterviewSchema>;
export type SubmitInterviewAnswerInput = z.infer<typeof SubmitInterviewAnswerSchema>;
