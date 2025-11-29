import { createRouter, createWebHistory } from "vue-router";
import { useFinanceStore } from "../stores/finance";

const routes = [
  {
    path: "/onboarding",
    name: "onboarding",
    component: () => import("../views/OnboardingView.vue"),
    meta: { layout: "plain" },
  },
  {
    path: "/",
    name: "dashboard",
    component: () => import("../views/DashboardView.vue"),
  },
  {
    path: "/apartment",
    name: "apartment",
    component: () => import("../views/ApartmentView.vue"),
  },
  {
    path: "/loans",
    name: "loans",
    component: () => import("../views/LoansView.vue"),
  },
  {
    path: "/monthly",
    name: "monthly",
    component: () => import("../views/MonthlyView.vue"),
  },
  {
    path: "/recurrents",
    name: "recurrents",
    component: () => import("../views/RecurrentsView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const store = useFinanceStore();

  if (!store.statusLoaded && !store.loading) {
    await store.bootstrap();
  }

  if (!store.hasBase && to.name !== "onboarding") {
    return next({ name: "onboarding" });
  }

  if (store.hasBase && to.name === "onboarding") {
    return next({ name: "dashboard" });
  }

  return next();
});

export default router;
