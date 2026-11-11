import { Router } from "express";
import { CreateJobApplicationSchema, UpdateJobApplicationSchema } from "@careerpilot/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createApplicationController,
  deleteApplicationController,
  getApplicationByIdController,
  listApplicationsController,
  updateApplicationController,
} from "./applications.controller";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(listApplicationsController));
router.get("/:id", asyncHandler(getApplicationByIdController));
router.post(
  "/",
  validateBody(CreateJobApplicationSchema),
  asyncHandler(createApplicationController)
);
router.patch(
  "/:id",
  validateBody(UpdateJobApplicationSchema),
  asyncHandler(updateApplicationController)
);
router.delete("/:id", asyncHandler(deleteApplicationController));

export default router;
