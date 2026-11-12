import { Router } from "express";
import { AnalyzeGitHubRepoSchema } from "@careerpilot/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  analyzeGitHubRepoController,
  deleteGitHubRepoController,
  listGitHubReposController,
} from "./projects.controller";

const router = Router();
router.use(requireAuth);

router.get("/github", asyncHandler(listGitHubReposController));
router.post(
  "/analyze-github",
  validateBody(AnalyzeGitHubRepoSchema),
  asyncHandler(analyzeGitHubRepoController)
);
router.delete("/github/:id", asyncHandler(deleteGitHubRepoController));

export default router;
