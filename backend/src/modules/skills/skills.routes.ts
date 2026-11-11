import { Router } from "express";
import { AnalyzeSkillGapSchema, UpsertUserSkillSchema } from "@careerpilot/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  analyzeSkillGapController,
  getSkillInventoryController,
  removeUserSkillController,
  upsertUserSkillController,
} from "./skills.controller";

const router = Router();

router.use(requireAuth);
router.get("/inventory", asyncHandler(getSkillInventoryController));
router.patch(
  "/inventory",
  validateBody(UpsertUserSkillSchema),
  asyncHandler(upsertUserSkillController)
);
router.delete("/inventory/:id", asyncHandler(removeUserSkillController));
router.post(
  "/analyze",
  validateBody(AnalyzeSkillGapSchema),
  asyncHandler(analyzeSkillGapController)
);

export default router;
