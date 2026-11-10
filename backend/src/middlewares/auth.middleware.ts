import { NextFunction, Request, Response } from "express";
import { UserRole } from "@careerpilot/shared";
import { UnauthorizedError } from "../utils/errors";
import { verifyAccessToken } from "../utils/crypto";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw new UnauthorizedError("Access token is empty");
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    throw new UnauthorizedError("Access token is invalid or expired");
  }
}
