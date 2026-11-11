import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getDashboardAnalyticsController,
  getDetailedAnalyticsController,
} from "./analytics.controller";

const router = Router();

router.use(requireAuth);
router.get("/dashboard", asyncHandler(getDashboardAnalyticsController));
router.get("/detailed", asyncHandler(getDetailedAnalyticsController));

export default router;
