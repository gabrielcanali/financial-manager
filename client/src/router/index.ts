import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue'),
    },
    {
      path: '/monthly',
      name: 'monthly',
      component: () => import('../pages/MonthlyPage.vue'),
    },
    {
      path: '/recurrents',
      name: 'recurrents',
      component: () => import('../pages/RecurrentsPage.vue'),
    },
    {
      path: '/apartment',
      name: 'apartment',
      component: () => import('../pages/ApartmentPage.vue'),
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('../pages/OnboardingPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

export default router
