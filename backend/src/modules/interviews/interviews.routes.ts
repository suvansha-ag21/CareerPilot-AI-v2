import { Router } from "express";
import { StartInterviewSchema, SubmitInterviewAnswerSchema } from "@careerpilot/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  completeInterviewController,
  deleteInterviewController,
  getInterviewByIdController,
  listInterviewsController,
  startInterviewController,
  submitInterviewAnswerController,
} from "./interviews.controller";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(listInterviewsController));
router.get("/:id", asyncHandler(getInterviewByIdController));
router.post(
  "/start",
  validateBody(StartInterviewSchema),
  asyncHandler(startInterviewController)
);
router.post(
  "/:id/answer",
  validateBody(SubmitInterviewAnswerSchema),
  asyncHandler(submitInterviewAnswerController)
);
router.post("/:id/complete", asyncHandler(completeInterviewController));
router.delete("/:id", asyncHandler(deleteInterviewController));

export default router;
