import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/auth/SignupView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/profile/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/records',
    name: 'records',
    component: () => import('../views/RecordsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/body-records',
    name: 'body-records',
    component: () => import('../views/health/BodyRecordsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diet',
    name: 'diet-dashboard',
    component: () => import('../views/diet/DietDashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diet/records',
    name: 'diet-records',
    component: () => import('../views/diet/DietRecordsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/foods',
    name: 'foods',
    component: () => import('../views/diet/FoodSearchView.vue'),
  },
  {
    path: '/saved-meals',
    name: 'saved-meals',
    component: () => import('../views/diet/SavedMealsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diet/recommend',
    name: 'diet-recommend',
    component: () => import('../views/diet/DietRecommendView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diet/recommendations/:id',
    name: 'diet-recommendation-detail',
    component: () => import('../views/diet/DietRecommendationDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diet/evaluation',
    name: 'diet-evaluation',
    component: () => import('../views/diet/DietEvaluationView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/workouts',
    name: 'workouts',
    component: () => import('../views/workout/WorkoutListView.vue'),
  },
  {
    path: '/workouts/:id',
    name: 'workout-detail',
    component: () => import('../views/workout/WorkoutDetailView.vue'),
  },
  {
    path: '/workout/recommend',
    name: 'workout-recommend',
    component: () => import('../views/workout/WorkoutRecommendView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/workout/progression',
    name: 'workout-progression',
    component: () => import('../views/workout/WorkoutProgressionView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/workout/logs',
    name: 'workout-logs',
    component: () => import('../views/workout/WorkoutLogsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/workout/routines',
    name: 'workout-routines',
    component: () => import('../views/workout/WorkoutRoutinesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/my-data',
    name: 'my-data',
    component: () => import('../views/manage/MyDataView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/progress',
    name: 'progress',
    component: () => import('../views/progress/ProgressView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/community',
    name: 'community',
    component: () => import('../views/community/CommunityListView.vue'),
  },
  {
    path: '/posts/:id',
    name: 'post-detail',
    component: () => import('../views/community/PostDetailView.vue'),
  },
  {
    path: '/users/:id',
    name: 'public-profile',
    component: () => import('../views/community/PublicProfileView.vue'),
  },
  {
    path: '/ai-chat',
    name: 'ai-chat',
    component: () => import('../views/ai/AiChatView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)
  const guestOnly = to.matched.some((route) => route.meta.guestOnly)
  const hasAccessToken = Boolean(localStorage.getItem('healthfit_access_token'))

  if (requiresAuth && !hasAccessToken) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (guestOnly && hasAccessToken) {
    return { name: 'profile' }
  }

  return true
})

export default router
