import { Router } from "express";
import monthsController from "../controllers/months.controller.js";

const router = Router();

router.get("/:year/:month", monthsController.getMonth);
router.post("/:year/:month/entries", monthsController.addEntry);

export default router;