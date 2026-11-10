import { AuthUserDTO, UpdateProfileInput, UserRole } from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";

export class ProfileService {
  async getCurrentUser(userId: string): Promise<AuthUserDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      throw new NotFoundError("User profile not found");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt.toISOString(),
      profile: {
        id: user.profile.id,
        userId: user.id,
        fullName: user.profile.fullName,
        headline: user.profile.headline,
        targetRole: user.profile.targetRole,
        yearsExperience: user.profile.yearsExperience,
        preferredStack: user.profile.preferredStack,
        location: user.profile.location,
        githubUrl: user.profile.githubUrl,
        linkedinUrl: user.profile.linkedinUrl,
        avatarUrl: user.profile.avatarUrl,
        updatedAt: user.profile.updatedAt.toISOString(),
      },
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthUserDTO> {
    await prisma.userProfile.update({
      where: { userId },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.headline !== undefined ? { headline: input.headline || null } : {}),
        ...(input.targetRole !== undefined ? { targetRole: input.targetRole } : {}),
        ...(input.yearsExperience !== undefined ? { yearsExperience: input.yearsExperience } : {}),
        ...(input.preferredStack !== undefined ? { preferredStack: input.preferredStack } : {}),
        ...(input.location !== undefined ? { location: input.location || null } : {}),
        ...(input.githubUrl !== undefined ? { githubUrl: input.githubUrl || null } : {}),
        ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl || null } : {}),
      },
    });

    return this.getCurrentUser(userId);
  }
}

export const profileService = new ProfileService();
