import { Router } from "express";
import monthsRoutes from "./months.routes.js";
import yearsRoutes from "./years.routes.js";
// placeholders pro futuro
// import dashboardRoutes from "./dashboard.routes.js";
// import apartmentRoutes from "./apartment.routes.js";

const router = Router();

router.use("/months", monthsRoutes);
router.use("/years", yearsRoutes);
// router.use("/dashboard", dashboardRoutes);
// router.use("/apartment", apartmentRoutes);

export default router;
