import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { getDashboardAnalyticsController } from "./analytics.controller";

const router = Router();

router.use(requireAuth);
router.get("/dashboard", asyncHandler(getDashboardAnalyticsController));

export default router;
