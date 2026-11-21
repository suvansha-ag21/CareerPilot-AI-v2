import { z } from "zod";
import { ProficiencyLevel, RoadmapLearningPreference, SkillCategory, SkillGapLearningPreference, TaskPriority, TaskStatus, } from "../constants/enums";
export const AnalyzeSkillGapSchema = z.object({
    targetRole: z.string().trim().min(2).max(120).optional(),
    resumeId: z.string().uuid().optional(),
    jobMatchId: z.string().uuid().optional(),
    learningPreference: z
        .nativeEnum(SkillGapLearningPreference)
        .optional()
        .default(SkillGapLearningPreference.BEGINNER_TO_ADVANCED),
});
export const UpsertUserSkillSchema = z.object({
    name: z.string().trim().min(1, "Skill name is required").max(80),
    category: z.nativeEnum(SkillCategory).default(SkillCategory.CORE_CS),
    proficiencyLevel: z.nativeEnum(ProficiencyLevel).default(ProficiencyLevel.INTERMEDIATE),
});
export const GenerateRoadmapSchema = z.object({
    targetRole: z.string().trim().min(2).max(120).optional(),
    skillLevel: z.nativeEnum(ProficiencyLevel).optional().default(ProficiencyLevel.BEGINNER),
    dailyStudyHours: z.coerce.number().int().min(1).max(12).optional().default(2),
    durationDays: z.coerce.number().int().min(14).max(180).optional().default(30),
    estimatedWeeks: z.coerce.number().int().min(2).max(26).default(4),
    hoursPerWeek: z.coerce.number().int().min(3).max(60).default(14),
    learningPreference: z
        .nativeEnum(RoadmapLearningPreference)
        .optional()
        .default(RoadmapLearningPreference.MIXED_LEARNING),
    resumeId: z.string().uuid().optional(),
    jobMatchId: z.string().uuid().optional(),
    focusSkills: z.array(z.string().trim().min(1).max(80)).max(15).optional(),
});
export const UpdateRoadmapTaskSchema = z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
});
