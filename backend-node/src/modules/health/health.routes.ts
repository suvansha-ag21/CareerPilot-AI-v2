import { Router, Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { aiServiceClient } from "../../clients/aiService.client";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    let dbStatus = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    const aiStatus = await aiServiceClient.checkHealth();

    const httpCode = dbStatus === "ok" ? 200 : 503;
    res.status(httpCode).json({
      success: dbStatus === "ok",
      data: {
        gateway: "ok",
        database: dbStatus,
        aiService: aiStatus,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

export default router;
