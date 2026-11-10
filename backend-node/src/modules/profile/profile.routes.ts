import { Router } from "express";
import { UpdateProfileSchema } from "@careerpilot/shared";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { getProfileController, updateProfileController } from "./profile.controller";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getProfileController));
router.patch("/", validateBody(UpdateProfileSchema), asyncHandler(updateProfileController));

export default router;
