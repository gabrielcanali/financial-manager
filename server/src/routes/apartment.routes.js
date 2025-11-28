import { Router } from "express";
import apartmentController from "../controllers/apartment.controller.js";

const router = Router();

router.get("/evolution", apartmentController.getEvolution);
router.get("/:year/:month", apartmentController.getMonth);
router.put("/:year/:month", apartmentController.setMonthData);

export default router;
