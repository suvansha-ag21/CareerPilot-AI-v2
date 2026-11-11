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
  targetRole: z.string().trim().min(2).max(120).optional(),
  subcategories: z.array(z.string().trim().min(1).max(50)).max(12).optional().default([]),
  difficulty: z.nativeEnum(InterviewDifficulty).default(InterviewDifficulty.MEDIUM),
  mode: z.nativeEnum(InterviewMode).default(InterviewMode.TEXT),
  durationMinutes: z.coerce.number().int().min(5).max(90).default(30),
  questionLimit: z.coerce.number().int().min(3).max(20).default(5),
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
