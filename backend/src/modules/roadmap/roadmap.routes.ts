import { Router } from "express";
import { GenerateRoadmapSchema, UpdateRoadmapTaskSchema } from "@careerpilot/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  activateRoadmapController,
  deleteRoadmapController,
  generateRoadmapController,
  getRoadmapByIdController,
  listRoadmapsController,
  updateRoadmapTaskController,
} from "./roadmap.controller";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(listRoadmapsController));
router.get("/:id", asyncHandler(getRoadmapByIdController));
router.post(
  "/generate",
  validateBody(GenerateRoadmapSchema),
  asyncHandler(generateRoadmapController)
);
router.patch("/:id/activate", asyncHandler(activateRoadmapController));
router.patch(
  "/:id/tasks/:taskId",
  validateBody(UpdateRoadmapTaskSchema),
  asyncHandler(updateRoadmapTaskController)
);
router.delete("/:id", asyncHandler(deleteRoadmapController));

export default router;
