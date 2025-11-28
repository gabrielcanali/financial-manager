import { Router } from "express";
import monthsRoutes from "./months.routes.js";
import yearsRoutes from "./years.routes.js";
import apartmentRoutes from "./apartment.routes.js";
import adminRoutes from "./admin.routes.js";
// placeholders pro futuro
// import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/months", monthsRoutes);
router.use("/years", yearsRoutes);
router.use("/apartment", apartmentRoutes);
router.use("/admin", adminRoutes);
// router.use("/dashboard", dashboardRoutes);

export default router;
