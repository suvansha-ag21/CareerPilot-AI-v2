import { Router } from "express";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "@careerpilot/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { authLimiter } from "../../middlewares/rateLimit.middleware";
import {
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  refreshController,
  registerController,
  resetPasswordController,
} from "./auth.controller";

const router = Router();

router.post("/register", authLimiter, validateBody(RegisterSchema), asyncHandler(registerController));
router.post("/login", authLimiter, validateBody(LoginSchema), asyncHandler(loginController));
router.post("/refresh", asyncHandler(refreshController));
router.post("/logout", asyncHandler(logoutController));
router.get("/me", requireAuth, asyncHandler(getMeController));
router.post(
  "/forgot-password",
  authLimiter,
  validateBody(ForgotPasswordSchema),
  asyncHandler(forgotPasswordController)
);
router.post(
  "/reset-password",
  authLimiter,
  validateBody(ResetPasswordSchema),
  asyncHandler(resetPasswordController)
);

export default router;
