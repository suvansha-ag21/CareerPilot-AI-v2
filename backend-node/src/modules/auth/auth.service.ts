import bcrypt from "bcryptjs";
import crypto from "crypto";
import { LoginInput, RegisterInput, AuthUserDTO, UserRole } from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { ConflictError, UnauthorizedError } from "../../utils/errors";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/crypto";

function formatAuthUser(user: {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  profile: {
    id: string;
    userId: string;
    fullName: string;
    headline: string | null;
    targetRole: string;
    yearsExperience: number;
    preferredStack: string[];
    location: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    avatarUrl: string | null;
    updatedAt: Date;
  } | null;
}): AuthUserDTO {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString(),
    profile: {
      id: user.profile?.id ?? "",
      userId: user.id,
      fullName: user.profile?.fullName ?? "",
      headline: user.profile?.headline ?? null,
      targetRole: user.profile?.targetRole ?? "Full Stack Software Engineer",
      yearsExperience: user.profile?.yearsExperience ?? 0,
      preferredStack: user.profile?.preferredStack ?? [],
      location: user.profile?.location ?? null,
      githubUrl: user.profile?.githubUrl ?? null,
      linkedinUrl: user.profile?.linkedinUrl ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      updatedAt: user.profile?.updatedAt.toISOString() ?? user.createdAt.toISOString(),
    },
  };
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError("An account with this email address already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const familyId = crypto.randomUUID();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          profile: {
            create: {
              fullName: input.fullName,
              targetRole: input.targetRole ?? "Full Stack Software Engineer",
              yearsExperience: input.yearsExperience ?? 0,
            },
          },
        },
        include: { profile: true },
      });

      const refresh = signRefreshToken(user.id, familyId);
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(refresh.token),
          familyId,
          expiresAt: refresh.expiresAt,
        },
      });

      return { user, refreshToken: refresh.token };
    });

    const accessToken = signAccessToken({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role as UserRole,
    });

    return {
      accessToken,
      refreshToken: result.refreshToken,
      user: formatAuthUser(result.user),
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const familyId = crypto.randomUUID();
    const refresh = signRefreshToken(user.id, familyId);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refresh.token),
        familyId,
        expiresAt: refresh.expiresAt,
      },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      accessToken,
      refreshToken: refresh.token,
      user: formatAuthUser(user),
    };
  }

  async refreshSession(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) {
      throw new UnauthorizedError("Refresh token missing");
    }

    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { profile: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedError("Session not recognized. Please sign in again.");
    }

    if (storedToken.revokedAt !== null) {
      // Token reuse detected: revoke the entire family to protect account
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError("Refresh token reuse detected. Session revoked.");
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("Session expired. Please sign in again.");
    }

    const nextRefresh = signRefreshToken(storedToken.user.id, storedToken.familyId);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.user.id,
          tokenHash: hashToken(nextRefresh.token),
          familyId: storedToken.familyId,
          expiresAt: nextRefresh.expiresAt,
        },
      }),
    ]);

    const accessToken = signAccessToken({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as UserRole,
    });

    return {
      accessToken,
      refreshToken: nextRefresh.token,
      user: formatAuthUser(storedToken.user),
    };
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (stored && !stored.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }
}

export const authService = new AuthService();
