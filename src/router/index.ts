import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import ChatView from '@/views/ChatView.vue'

const isDev = import.meta.env.DEV
// 开发保持 history，生产改用 hash，避免 file:// 下 path 失配
const history = isDev
  ? createWebHistory(import.meta.env.BASE_URL)
  : createWebHashHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history,
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatView,
      // 添加子路由，用于在ChatView内部显示SettingsView模态框
      children: [
        {
          path: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          // 设置页的子路由（左侧导航对应的内容）
          children: [
            { path: '', redirect: '/settings/connection' }, // 默认重定向到新页面
            {
              path: 'connection',
              component: () => import('@/components/settings/ServiceConnection.vue'),
            }, // 新增路由
            {
              path: 'conversation',
              component: () => import('@/components/settings/ConversationSettings.vue'),
            },
            { path: 'model', component: () => import('@/components/settings/ModelSettings.vue') },
            {
              path: 'preferences',
              component: () => import('@/components/settings/Preferences.vue'),
            },
          ],
        },
      ],
    },
  ],
})

export default router
