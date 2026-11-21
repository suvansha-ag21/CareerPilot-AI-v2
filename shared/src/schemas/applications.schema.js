import { z } from "zod";
import { ApplicationStatus, JobType } from "../constants/enums";
export const CreateJobApplicationSchema = z.object({
    company: z.string().trim().min(1, "Company name is required").max(120),
    jobRole: z.string().trim().min(1, "Job role is required").max(120),
    jobType: z.nativeEnum(JobType).optional().default(JobType.FULL_TIME),
    jobDescription: z.string().trim().max(25000).optional(),
    applicationDate: z.string().trim().optional(),
    status: z.nativeEnum(ApplicationStatus).default(ApplicationStatus.APPLIED),
    interviewDate: z.string().trim().nullable().optional(),
    applicationUrl: z.string().trim().max(500).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
});
export const UpdateJobApplicationSchema = z.object({
    company: z.string().trim().min(1).max(120).optional(),
    jobRole: z.string().trim().min(1).max(120).optional(),
    jobType: z.nativeEnum(JobType).optional(),
    jobDescription: z.string().trim().max(25000).nullable().optional(),
    applicationDate: z.string().trim().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
    interviewDate: z.string().trim().nullable().optional(),
    applicationUrl: z.string().trim().max(500).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
});
