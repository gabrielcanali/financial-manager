import { Router } from "express";
import monthsRoutes from "./months.routes.js";
// placeholders pro futuro
// import dashboardRoutes from "./dashboard.routes.js";
// import apartmentRoutes from "./apartment.routes.js";

const router = Router();

router.use("/months", monthsRoutes);
// router.use("/dashboard", dashboardRoutes);
// router.use("/apartment", apartmentRoutes);

export default router;