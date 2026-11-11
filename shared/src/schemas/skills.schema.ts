import { z } from "zod";
import { ProficiencyLevel, SkillCategory, TaskPriority, TaskStatus } from "../constants/enums";

export const AnalyzeSkillGapSchema = z.object({
  targetRole: z.string().trim().min(2).max(120).optional(),
  resumeId: z.string().uuid().optional(),
  jobMatchId: z.string().uuid().optional(),
});

export const UpsertUserSkillSchema = z.object({
  name: z.string().trim().min(1, "Skill name is required").max(80),
  category: z.nativeEnum(SkillCategory).default(SkillCategory.CORE_CS),
  proficiencyLevel: z.nativeEnum(ProficiencyLevel).default(ProficiencyLevel.INTERMEDIATE),
});

export const GenerateRoadmapSchema = z.object({
  targetRole: z.string().trim().min(2).max(120).optional(),
  estimatedWeeks: z.coerce.number().int().min(2).max(12).default(4),
  hoursPerWeek: z.coerce.number().int().min(3).max(40).default(10),
  resumeId: z.string().uuid().optional(),
  jobMatchId: z.string().uuid().optional(),
  focusSkills: z.array(z.string().trim().min(1).max(80)).max(15).optional(),
});

export const UpdateRoadmapTaskSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
});

export type AnalyzeSkillGapInput = z.infer<typeof AnalyzeSkillGapSchema>;
export type UpsertUserSkillInput = z.infer<typeof UpsertUserSkillSchema>;
export type GenerateRoadmapInput = z.infer<typeof GenerateRoadmapSchema>;
export type UpdateRoadmapTaskInput = z.infer<typeof UpdateRoadmapTaskSchema>;
