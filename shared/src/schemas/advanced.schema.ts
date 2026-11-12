import { z } from "zod";

export const AnalyzeGitHubRepoSchema = z.object({
  repoUrl: z
    .string()
    .trim()
    .url("Valid GitHub repository URL is required")
    .refine(
      (val) => /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/.test(val),
      "URL must point to a GitHub repository (e.g. https://github.com/owner/repo)"
    ),
});

export const GenerateDrillsSchema = z.object({
  targetRole: z.string().trim().min(2).max(120).optional(),
  topics: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  count: z.coerce.number().int().min(3).max(15).default(6),
});

export const ReviewFlashcardSchema = z.object({
  rating: z.coerce.number().int().min(1).max(4),
});

export type AnalyzeGitHubRepoInput = z.infer<typeof AnalyzeGitHubRepoSchema>;
export type GenerateDrillsInput = z.infer<typeof GenerateDrillsSchema>;
export type ReviewFlashcardInput = z.infer<typeof ReviewFlashcardSchema>;
