import { Request, Response } from "express";
import { UnauthorizedError } from "../../utils/errors";
import { analyticsService } from "./analytics.service";

export async function getOverviewController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await analyticsService.getOverview(req.user.id);
  res.status(200).json({ success: true, data });
}
