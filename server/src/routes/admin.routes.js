import { Router } from "express";
import adminController from "../controllers/admin.controller.js";

const router = Router();

router.get("/export", adminController.exportData);
router.post("/import", adminController.importData);
router.post("/backup", adminController.backupData);

export default router;
