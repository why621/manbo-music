import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/player/:id?',
    name: 'Player',
    component: () => import('@/views/Player.vue'),
    props: true
  },
  {
    path: '/playlist/:id?',
    name: 'Playlist',
    component: () => import('@/views/Playlist.vue'),
    props: true
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/History.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('@/views/Upload.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path)
  
  // 如果访问需要认证的页面但没有token，跳转到登录页
  if (authRequired && !token) {
    return next('/login')
  }
  
  // 如果已登录用户访问登录/注册页，跳转到首页
  if (publicPages.includes(to.path) && token) {
    return next('/')
  }
  
  next()
})

export default router
