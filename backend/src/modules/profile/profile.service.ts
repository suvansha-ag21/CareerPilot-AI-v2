import { AuthUserDTO, ProficiencyLevel, SkillCategory, UpdateProfileInput } from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";
import { getFormattedUserById } from "../../utils/userMapper";

const CONFIDENCE_BY_LEVEL: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.BEGINNER]: 35,
  [ProficiencyLevel.INTERMEDIATE]: 65,
  [ProficiencyLevel.ADVANCED]: 90,
};

export class ProfileService {
  async getProfile(userId: string): Promise<AuthUserDTO> {
    const user = await getFormattedUserById(userId);
    if (!user) {
      throw new NotFoundError("Candidate profile not found");
    }
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthUserDTO> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.profileImage !== undefined ? { profileImage: input.profileImage || null } : {}),
          ...(input.headline !== undefined ? { headline: input.headline || null } : {}),
          ...(input.targetRole !== undefined ? { targetRole: input.targetRole } : {}),
          ...(input.yearsExperience !== undefined ? { yearsExperience: input.yearsExperience } : {}),
          ...(input.location !== undefined ? { location: input.location || null } : {}),
          ...(input.githubUrl !== undefined ? { githubUrl: input.githubUrl || null } : {}),
          ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl || null } : {}),
          ...(input.careerPreferences !== undefined
            ? { careerPreferences: input.careerPreferences }
            : {}),
        },
      });

      if (input.educations !== undefined) {
        await tx.education.deleteMany({ where: { userId } });
        if (input.educations.length > 0) {
          await tx.education.createMany({
            data: input.educations.map((ed) => ({
              userId,
              institution: ed.institution,
              degree: ed.degree,
              fieldOfStudy: ed.fieldOfStudy || null,
              startYear: ed.startYear ?? null,
              endYear: ed.endYear ?? null,
              grade: ed.grade || null,
            })),
          });
        }
      }

      if (input.workExperiences !== undefined) {
        await tx.workExperience.deleteMany({ where: { userId } });
        if (input.workExperiences.length > 0) {
          await tx.workExperience.createMany({
            data: input.workExperiences.map((exp) => ({
              userId,
              company: exp.company,
              roleTitle: exp.roleTitle,
              startDate: exp.startDate || null,
              endDate: exp.endDate || null,
              isCurrent: exp.isCurrent ?? false,
              description: exp.description || null,
              highlights: exp.highlights ?? [],
            })),
          });
        }
      }

      if (input.projects !== undefined) {
        await tx.candidateProject.deleteMany({ where: { userId } });
        if (input.projects.length > 0) {
          await tx.candidateProject.createMany({
            data: input.projects.map((proj) => ({
              userId,
              title: proj.title,
              techStack: proj.techStack ?? [],
              description: proj.description,
              repoUrl: proj.repoUrl || null,
              liveUrl: proj.liveUrl || null,
            })),
          });
        }
      }

      if (input.skills !== undefined) {
        await tx.userSkill.deleteMany({ where: { userId } });

        // Deduplicate by normalizedName cleanly
        const uniqueMap = new Map<
          string,
          { name: string; category: SkillCategory; proficiencyLevel: ProficiencyLevel }
        >();
        for (const item of input.skills) {
          const norm = item.name.trim().toLowerCase();
          if (norm) {
            uniqueMap.set(norm, {
              name: item.name.trim(),
              category: item.category ?? SkillCategory.CORE_CS,
              proficiencyLevel: item.proficiencyLevel ?? ProficiencyLevel.INTERMEDIATE,
            });
          }
        }

        for (const [normalizedName, item] of uniqueMap.entries()) {
          const skillRecord = await tx.skill.upsert({
            where: { normalizedName },
            update: {},
            create: {
              name: item.name,
              normalizedName,
              category: item.category,
            },
          });

          await tx.userSkill.create({
            data: {
              userId,
              skillId: skillRecord.id,
              proficiencyLevel: item.proficiencyLevel,
              source: "PROFILE",
              confidenceScore: CONFIDENCE_BY_LEVEL[item.proficiencyLevel],
            },
          });
        }
      }
    });

    return this.getProfile(userId);
  }
}

export const profileService = new ProfileService();
