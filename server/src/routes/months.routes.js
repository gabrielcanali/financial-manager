import { Router } from "express";
import monthsController from "../controllers/months.controller.js";

const router = Router();

router.get("/:year/:month", monthsController.getMonth);
router.post("/:year/:month/entries", monthsController.addEntry);
router.put("/:year/:month/data", monthsController.setMonthData);
router.put("/:year/:month/calendar", monthsController.setMonthCalendar);
router.put("/:year/:month/entries/:entryId", monthsController.updateEntry);
router.delete("/:year/:month/entries/:entryId", monthsController.deleteEntry);
router.post(
  "/:year/:month/recurrents/:period",
  monthsController.addRecurring
);
router.put(
  "/:year/:month/recurrents/:period/:recurringId",
  monthsController.updateRecurring
);
router.delete(
  "/:year/:month/recurrents/:period/:recurringId",
  monthsController.deleteRecurring
);

export default router;
