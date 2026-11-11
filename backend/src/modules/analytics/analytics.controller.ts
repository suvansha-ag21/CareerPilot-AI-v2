import { Request, Response } from "express";
import { UnauthorizedError } from "../../utils/errors";
import { analyticsService } from "./analytics.service";

export async function getDashboardAnalyticsController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await analyticsService.getDashboardAnalytics(req.user.id);
  res.status(200).json({ success: true, data });
}

export async function getDetailedAnalyticsController(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await analyticsService.getDetailedAnalytics(req.user.id);
  res.status(200).json({ success: true, data });
}
