import { Request, Response } from "express";
import { env } from "../../config/env";
import { authService } from "./auth.service";

const REFRESH_COOKIE_NAME = "cp_refresh_token";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
  });
}

export async function registerController(req: Request, res: Response): Promise<void> {
  const { accessToken, refreshToken, user } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({
    success: true,
    data: { accessToken, user },
  });
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({
    success: true,
    data: { accessToken, user },
  });
}

export async function refreshController(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  const { accessToken, refreshToken, user } = await authService.refreshSession(rawToken);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({
    success: true,
    data: { accessToken, user },
  });
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logout(rawToken);
  clearRefreshCookie(res);
  res.status(200).json({
    success: true,
    data: { loggedOut: true },
  });
}
