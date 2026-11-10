import { Request, Response } from "express";
import { profileService } from "./profile.service";
import { UnauthorizedError } from "../../utils/errors";

export async function getProfileController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await profileService.getCurrentUser(req.user.id);
  res.status(200).json({ success: true, data });
}

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await profileService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data });
}
