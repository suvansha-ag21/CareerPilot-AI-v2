import { z } from "zod";
import { ProficiencyLevel, SkillCategory } from "../constants/enums";

const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL starting with http:// or https://")
  .optional()
  .or(z.literal(""));

export const EducationItemSchema = z.object({
  id: z.string().uuid().optional(),
  institution: z.string().trim().min(2, "Institution name is required").max(120),
  degree: z.string().trim().min(2, "Degree is required").max(100),
  fieldOfStudy: z.string().trim().max(100).optional().nullable(),
  startYear: z.number().int().min(1980).max(2040).optional().nullable(),
  endYear: z.number().int().min(1980).max(2045).optional().nullable(),
  grade: z.string().trim().max(30).optional().nullable(),
});

export const WorkExperienceItemSchema = z.object({
  id: z.string().uuid().optional(),
  company: z.string().trim().min(2, "Company name is required").max(120),
  roleTitle: z.string().trim().min(2, "Role title is required").max(120),
  startDate: z.string().trim().max(40).optional().nullable(),
  endDate: z.string().trim().max(40).optional().nullable(),
  isCurrent: z.boolean().optional().default(false),
  description: z.string().trim().max(2000).optional().nullable(),
  highlights: z.array(z.string().trim().min(1).max(300)).max(10).optional().default([]),
});

export const ProjectItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Project title is required").max(120),
  techStack: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  description: z.string().trim().min(5, "Short description is required").max(2000),
  repoUrl: optionalUrl.nullable(),
  liveUrl: optionalUrl.nullable(),
});

export const UserSkillItemSchema = z.object({
  name: z.string().trim().min(1).max(60),
  category: z.nativeEnum(SkillCategory).optional().default(SkillCategory.CORE_CS),
  proficiencyLevel: z.nativeEnum(ProficiencyLevel).optional().default(ProficiencyLevel.INTERMEDIATE),
});

export const CareerPreferencesSchema = z.object({
  preferredWorkMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional().default("REMOTE"),
  preferredLocations: z.array(z.string().trim().max(60)).max(8).optional().default([]),
  weeklyStudyHours: z.number().int().min(1).max(80).optional().default(10),
  openToInternships: z.boolean().optional().default(true),
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  profileImage: optionalUrl.nullable(),
  headline: z.string().trim().max(180).optional().nullable(),
  targetRole: z.string().trim().min(2).max(100).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  location: z.string().trim().max(100).optional().nullable(),
  githubUrl: optionalUrl.nullable(),
  linkedinUrl: optionalUrl.nullable(),
  careerPreferences: CareerPreferencesSchema.optional(),
  educations: z.array(EducationItemSchema).max(10).optional(),
  workExperiences: z.array(WorkExperienceItemSchema).max(15).optional(),
  projects: z.array(ProjectItemSchema).max(15).optional(),
  skills: z.array(UserSkillItemSchema).max(50).optional(),
});

export type EducationInput = z.infer<typeof EducationItemSchema>;
export type WorkExperienceInput = z.infer<typeof WorkExperienceItemSchema>;
export type ProjectInput = z.infer<typeof ProjectItemSchema>;
export type UserSkillInput = z.infer<typeof UserSkillItemSchema>;
export type CareerPreferences = z.infer<typeof CareerPreferencesSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
