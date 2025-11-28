import { Router } from "express";
import summaryController from "../controllers/summary.controller.js";

const router = Router();

router.get("/:year/summary", summaryController.getYearSummary);

export default router;
