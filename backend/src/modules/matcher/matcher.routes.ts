import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createJobMatchController,
  deleteJobMatchController,
  getJobMatchByIdController,
  listJobMatchesController,
} from "./matcher.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

const router = Router();

router.use(requireAuth);
router.post("/", upload.single("jdFile"), asyncHandler(createJobMatchController));
router.get("/", asyncHandler(listJobMatchesController));
router.get("/:id", asyncHandler(getJobMatchByIdController));
router.delete("/:id", asyncHandler(deleteJobMatchController));

export default router;
