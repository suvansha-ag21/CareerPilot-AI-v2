import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { apiLimiter } from "./middlewares/rateLimit.middleware";
import { errorHandler } from "./utils/errors";
import authRoutes from "./modules/auth/auth.routes";
import profileRoutes from "./modules/profile/profile.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import healthRoutes from "./modules/health/health.routes";
import resumeRoutes from "./modules/resumes/resume.routes";
import matcherRoutes from "./modules/matcher/matcher.routes";

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/job-matches", matcherRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

app.use(errorHandler);

export default app;
