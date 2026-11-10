import { AuthUserDTO, CareerPreferences, ProficiencyLevel, SkillCategory, SkillSource, UserRole } from "@careerpilot/shared";
import { prisma } from "../config/prisma";

export const USER_WITH_RELATIONS = {
  educations: { orderBy: { endYear: "desc" as const } },
  workExperiences: true,
  projects: true,
  skills: {
    include: { skill: true },
    orderBy: { confidenceScore: "desc" as const },
  },
};

export async function getFormattedUserById(userId: string): Promise<AuthUserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_WITH_RELATIONS,
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    profileImage: user.profileImage,
    headline: user.headline,
    targetRole: user.targetRole,
    yearsExperience: user.yearsExperience,
    location: user.location,
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    careerPreferences: (user.careerPreferences as CareerPreferences | null) ?? null,
    educations: user.educations.map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      startYear: e.startYear,
      endYear: e.endYear,
      grade: e.grade,
    })),
    workExperiences: user.workExperiences.map((w) => ({
      id: w.id,
      company: w.company,
      roleTitle: w.roleTitle,
      startDate: w.startDate,
      endDate: w.endDate,
      isCurrent: w.isCurrent,
      description: w.description,
      highlights: w.highlights,
    })),
    projects: user.projects.map((p) => ({
      id: p.id,
      title: p.title,
      techStack: p.techStack,
      description: p.description,
      repoUrl: p.repoUrl,
      liveUrl: p.liveUrl,
    })),
    skills: user.skills.map((us) => ({
      id: us.id,
      skillId: us.skillId,
      name: us.skill.name,
      category: us.skill.category as SkillCategory,
      proficiencyLevel: us.proficiencyLevel as ProficiencyLevel,
      source: us.source as SkillSource,
      confidenceScore: us.confidenceScore,
    })),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
