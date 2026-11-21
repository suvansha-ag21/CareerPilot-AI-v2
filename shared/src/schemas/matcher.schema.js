import { z } from "zod";
import { JobType } from "../constants/enums";
export const CreateJobMatchSchema = z.object({
    resumeId: z.string().uuid("Please select a valid uploaded resume"),
    targetRole: z.string().trim().min(2, "Target role must be at least 2 characters").max(120).optional(),
    companyName: z.string().trim().max(120).optional(),
    experienceLevel: z.string().trim().max(40).optional(),
    jobType: z.nativeEnum(JobType).optional().default(JobType.FULL_TIME),
    jobDescription: z.string().trim().max(25000).optional(),
});
