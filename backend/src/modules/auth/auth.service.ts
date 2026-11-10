import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UserRole,
} from "@careerpilot/shared";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../../utils/errors";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/crypto";
import { getFormattedUserById } from "../../utils/userMapper";

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError("An account with this email address already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const familyId = crypto.randomUUID();

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          targetRole: input.targetRole ?? "Full Stack Developer",
          yearsExperience: input.yearsExperience ?? 0,
        },
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

    const formattedUser = await getFormattedUserById(created.user.id);
    if (!formattedUser) {
      throw new NotFoundError("Created user could not be loaded");
    }

    const accessToken = signAccessToken({
      sub: created.user.id,
      email: created.user.email,
      role: created.user.role as UserRole,
    });

    return {
      accessToken,
      refreshToken: created.refreshToken,
      user: formattedUser,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
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

    const formattedUser = await getFormattedUserById(user.id);
    if (!formattedUser) {
      throw new NotFoundError("User profile not found");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      accessToken,
      refreshToken: refresh.token,
      user: formattedUser,
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
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError("Session not recognized. Please sign in again.");
    }

    if (storedToken.revokedAt !== null) {
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

    const formattedUser = await getFormattedUserById(storedToken.user.id);
    if (!formattedUser) {
      throw new NotFoundError("User profile not found");
    }

    const accessToken = signAccessToken({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as UserRole,
    });

    return {
      accessToken,
      refreshToken: nextRefresh.token,
      user: formattedUser,
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

  async getMe(userId: string) {
    const user = await getFormattedUserById(userId);
    if (!user) {
      throw new NotFoundError("Authenticated user no longer exists");
    }
    return user;
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      // Return identical generic confirmation to prevent account enumeration
      return {
        sent: true,
        message: "If an account exists for that email, password reset instructions have been issued.",
      };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          expiresAt,
        },
      }),
    ]);

    if (env.NODE_ENV === "development") {
      console.info(
        `[PasswordReset] Reset link for ${user.email}: ${env.FRONTEND_URL}/reset-password?token=${rawToken}`
      );
    }

    return {
      sent: true,
      message: "If an account exists for that email, password reset instructions have been issued.",
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = hashToken(input.token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date()) {
      throw new BadRequestError("Password reset token is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      reset: true,
      message: "Password updated successfully. You can now sign in with your new password.",
    };
  }
}

export const authService = new AuthService();
