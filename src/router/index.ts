import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
