import { z } from "zod";
import { ResumeAnalysisType } from "../constants/enums";

export const AnalyzeResumeOptionsSchema = z.object({
  targetRole: z.string().trim().min(2).max(120).optional(),
  experienceLevel: z.string().trim().max(40).optional(),
  analysisType: z
    .nativeEnum(ResumeAnalysisType)
    .default(ResumeAnalysisType.COMPLETE_ANALYSIS),
});

export type AnalyzeResumeOptionsInput = z.infer<typeof AnalyzeResumeOptionsSchema>;
