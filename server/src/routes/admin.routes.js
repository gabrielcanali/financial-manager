import { Router } from "express";
import adminController from "../controllers/admin.controller.js";

const router = Router();

router.get("/status", adminController.getStatus);
router.get("/export", adminController.exportData);
router.post("/validate", adminController.validateImport);
router.post("/import", adminController.importData);
router.post("/bootstrap", adminController.bootstrapData);
router.post("/backup", adminController.backupData);

export default router;
