import { Router } from "express";
import { GenerateDrillsSchema, ReviewFlashcardSchema } from "@careerpilot/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  deleteDrillController,
  generateDrillsController,
  listDrillsController,
  reviewDrillController,
} from "./drills.controller";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listDrillsController));
router.post(
  "/generate",
  validateBody(GenerateDrillsSchema),
  asyncHandler(generateDrillsController)
);
router.post(
  "/:id/review",
  validateBody(ReviewFlashcardSchema),
  asyncHandler(reviewDrillController)
);
router.delete("/:id", asyncHandler(deleteDrillController));

export default router;
