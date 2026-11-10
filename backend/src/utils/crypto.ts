import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "@careerpilot/shared";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  familyId: string;
  jti: string;
  type: "refresh";
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(userId: string, familyId: string): { token: string; expiresAt: Date } {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  const token = jwt.sign({ sub: userId, familyId, jti, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d`,
  });
  return { token, expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== "access" || !decoded.sub) {
    throw new Error("Invalid access token payload");
  }
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== "refresh" || !decoded.sub || !decoded.familyId) {
    throw new Error("Invalid refresh token payload");
  }
  return decoded;
}
