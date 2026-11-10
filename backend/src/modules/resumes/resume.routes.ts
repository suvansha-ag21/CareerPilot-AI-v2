import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { MAX_RESUME_SIZE_BYTES } from "../../utils/fileValidation";
import {
  analyzeResumeController,
  deleteResumeController,
  getResumeByIdController,
  getResumeFileController,
  listResumesController,
  setPrimaryResumeController,
  syncResumeSkillsController,
  uploadResumeController,
} from "./resume.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_SIZE_BYTES,
    files: 1,
  },
});

const router = Router();

router.use(requireAuth);
router.post("/upload", upload.single("file"), asyncHandler(uploadResumeController));
router.get("/", asyncHandler(listResumesController));
router.get("/:id", asyncHandler(getResumeByIdController));
router.get("/:id/file", asyncHandler(getResumeFileController));
router.post("/:id/analyze", asyncHandler(analyzeResumeController));
router.patch("/:id/primary", asyncHandler(setPrimaryResumeController));
router.post("/:id/sync-skills", asyncHandler(syncResumeSkillsController));
router.delete("/:id", asyncHandler(deleteResumeController));

export default router;
