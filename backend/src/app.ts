import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth/auth.routes.js";
import { auditMutations } from "./audit/audit.middleware.js";
import { requireAuth } from "./authentication/authentication.middleware.js";
import { globalErrorHandler } from "./common/filters/global-error-handler.js";
import { notFound } from "./common/middleware/not-found.js";
import { requestContext } from "./common/middleware/request-context.js";
import { requestLogger } from "./common/middleware/request-logger.js";
import { apiLimiter, authLimiter, uploadLimiter } from "./common/middleware/rate-limit.js";
import { environment } from "./config/environment.js";
import { dashboardRouter } from "./dashboard/dashboard.routes.js";
import { healthRouter } from "./health/health.routes.js";
import { modelDsrRouter } from "./model-dsr/model-dsr.routes.js";
import { streamRouter } from "./notifications/progress-stream.routes.js";
import { pdfRouter } from "./pdf/pdf.routes.js";
import { projectsRouter } from "./projects/projects.routes.js";
import { jobsRouter } from "./queue/jobs.routes.js";
import { replenishmentRouter } from "./replenishment/replenishment.routes.js";
import { reportsRouter } from "./reports/reports.routes.js";
import { searchRouter } from "./search/search.routes.js";
import { settingsRouter } from "./settings/settings.routes.js";
import { filesRouter } from "./uploads/uploads.routes.js";
import { usersRouter } from "./users/users.routes.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'self'"],
        "object-src": ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: "same-site" }
  }));
  app.use(cors({ origin: environment.webOrigin, credentials: true }));
  app.use(apiLimiter);
  app.use(cookieParser());
  app.use(express.json({ limit: "200mb" }));
  app.use(express.urlencoded({ extended: true, limit: "200mb" }));
  app.use(requestLogger);
  app.get('/', (req, res) => res.status(200).send('OK'));
  app.use(healthRouter);

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", requireAuth, auditMutations, dashboardRouter);
  app.use("/api/files", requireAuth, uploadLimiter, auditMutations, filesRouter);
  app.use("/api/jobs", requireAuth, auditMutations, jobsRouter);
  app.use("/api/projects", requireAuth, auditMutations, projectsRouter);
  app.use("/api/reports", requireAuth, auditMutations, reportsRouter);
  app.use("/api/users", requireAuth, auditMutations, usersRouter);
  app.use("/api/model-dsrs", requireAuth, auditMutations, modelDsrRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/search", requireAuth, auditMutations, searchRouter);
  app.use("/api/stream", requireAuth, streamRouter);
  app.use("/api", requireAuth, auditMutations, replenishmentRouter);
  app.use("/api", requireAuth, uploadLimiter, auditMutations, pdfRouter);

  app.use(notFound);
  app.use(globalErrorHandler);
  return app;
}
