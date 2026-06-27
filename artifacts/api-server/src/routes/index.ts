// VERSION: 1.0.0
// Path: artifacts/api-server/src/routes/index.ts
import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import datasetsRouter from "./datasets.js";
import kpiRouter from "./kpi.js";
import scenarioRouter from "./scenario.js";
import forecastRouter from "./forecast.js";
import portfolioRouter from "./portfolio.js";
import dashboardsRouter from "./dashboards.js";
import mapRouter from "./map.js";
import exportRouter from "./export.js";
import agentsRouter from "./agents.js";
import notificationsRouter from "./notifications.js";
import auditRouter from "./audit.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/datasets", datasetsRouter);
router.use("/kpi", kpiRouter);
router.use("/scenario", scenarioRouter);
router.use("/forecast", forecastRouter);
router.use("/portfolio", portfolioRouter);
router.use("/dashboards", dashboardsRouter);
router.use("/map", mapRouter);
router.use("/export", exportRouter);
router.use("/agents", agentsRouter);
router.use("/notifications", notificationsRouter);
router.use("/audit", auditRouter);

export default router;
