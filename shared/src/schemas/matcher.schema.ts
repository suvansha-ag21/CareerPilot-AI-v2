import { z } from "zod";

export const CreateJobMatchSchema = z.object({
  resumeId: z.string().uuid("Please select a valid uploaded resume"),
  targetRole: z.string().trim().min(2, "Target role must be at least 2 characters").max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  jobDescription: z.string().trim().max(25000).optional(),
});

export type CreateJobMatchInput = z.infer<typeof CreateJobMatchSchema>;
