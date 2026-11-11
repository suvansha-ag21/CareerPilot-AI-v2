import { Router } from "express";
import multer from "multer";
import { StartInterviewSchema, SubmitInterviewAnswerSchema } from "@careerpilot/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { MAX_VOICE_AUDIO_BYTES } from "../../utils/fileValidation";
import {
  completeInterviewController,
  deleteInterviewController,
  getInterviewByIdController,
  listInterviewsController,
  startInterviewController,
  submitInterviewAnswerController,
  submitVoiceAnswerController,
  transcribeAudioController,
} from "./interviews.controller";

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VOICE_AUDIO_BYTES,
    files: 1,
  },
});

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
router.post(
  "/:id/transcribe",
  audioUpload.single("audio"),
  asyncHandler(transcribeAudioController)
);
router.post(
  "/:id/answer-voice",
  audioUpload.single("audio"),
  asyncHandler(submitVoiceAnswerController)
);
router.post("/:id/complete", asyncHandler(completeInterviewController));
router.delete("/:id", asyncHandler(deleteInterviewController));

export default router;
