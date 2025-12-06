import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/page/:slug',
    name: 'page',
    component: () => import('../views/Page.vue')
  },
  {
    path: '/post/:slug',
    name: 'post',
    component: () => import('../views/Post.vue')
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/admin/Login.vue')
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'posts',
        name: 'admin-posts',
        component: () => import('../views/admin/Posts.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'posts/new',
        name: 'admin-post-new',
        component: () => import('../views/admin/PostEdit.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'posts/:id/edit',
        name: 'admin-post-edit',
        component: () => import('../views/admin/PostEdit.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'pages',
        name: 'admin-pages',
        component: () => import('../views/admin/Pages.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'pages/new',
        name: 'admin-page-new',
        component: () => import('../views/admin/PageEdit.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'pages/:id/edit',
        name: 'admin-page-edit',
        component: () => import('../views/admin/PageEdit.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'media',
        name: 'admin-media',
        component: () => import('../views/admin/Media.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'navigation',
        name: 'admin-navigation',
        component: () => import('../views/admin/Navigation.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../views/admin/Settings.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../views/admin/Users.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'design',
        name: 'admin-design',
        component: () => import('../views/admin/Design.vue'),
        meta: { requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'admin-login' })
  } else if (to.name === 'admin-login' && authStore.isAuthenticated) {
    next({ name: 'admin' })
  } else {
    next()
  }
})

export default router
