import { Router } from "express";
import { LoginSchema, RegisterSchema } from "@careerpilot/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middlewares/validate.middleware";
import { authLimiter } from "../../middlewares/rateLimit.middleware";
import {
  loginController,
  logoutController,
  refreshController,
  registerController,
} from "./auth.controller";

const router = Router();

router.post("/register", authLimiter, validateBody(RegisterSchema), asyncHandler(registerController));
router.post("/login", authLimiter, validateBody(LoginSchema), asyncHandler(loginController));
router.post("/refresh", asyncHandler(refreshController));
router.post("/logout", asyncHandler(logoutController));

export default router;
