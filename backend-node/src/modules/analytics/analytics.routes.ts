import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { getOverviewController } from "./analytics.controller";

const router = Router();

router.use(requireAuth);
router.get("/overview", asyncHandler(getOverviewController));

export default router;
