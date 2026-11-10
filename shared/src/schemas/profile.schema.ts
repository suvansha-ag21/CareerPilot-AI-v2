import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL starting with http:// or https://")
  .optional()
  .or(z.literal(""));

export const UpdateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  headline: z.string().trim().max(160).optional(),
  targetRole: z.string().trim().min(2).max(100).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  preferredStack: z.array(z.string().trim().min(1).max(40)).max(25).optional(),
  location: z.string().trim().max(100).optional(),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
