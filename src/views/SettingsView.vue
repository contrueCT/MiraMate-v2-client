<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/core/stores/settings'
import { useServiceStore } from '@/core/stores/service'
import { backendToFrontend, frontendToBackend } from '@/core/services/configAdapter'

// 导入所有需要的图标
import IconServiceConnection from '@/components/icons/IconServiceConnection.vue'
import IconConversation from '@/components/icons/IconConversation.vue'
import IconModel from '@/components/icons/IconModel.vue'
import IconPreferences from '@/components/icons/IconPreferences.vue'
import IconClose from '@/components/icons/IconClose.vue'

// 1. 实例化所有的Store
const settingsStore = useSettingsStore()
const serviceStore = useServiceStore()
const router = useRouter()

// 2. 创建一个包含所有设置项的、完整的本地草稿(draft)
const draft = ref({
  // a. 来自 serviceStore 的服务配置
  service: {
    url: serviceStore.endpointUrl,
    key: serviceStore.authKey,
    env: serviceStore.environment,
  },
  // b. 来自 settingsStore 的对话设定
  conversation: JSON.parse(JSON.stringify(settingsStore.conversation)),
  // c. 来自 settingsStore 的模型设定 (经过转换)
  models: backendToFrontend(settingsStore.llmConfigs),
  // d. 来自 settingsStore 的应用偏好
  preferences: JSON.parse(JSON.stringify(settingsStore.preferences)),
})

// 3. 创建一个包含所有原始状态的计算属性，用于比较变更
const originalState = computed(() => ({
  service: {
    url: serviceStore.endpointUrl,
    key: serviceStore.authKey,
    env: serviceStore.environment,
  },
  conversation: settingsStore.conversation,
  models: backendToFrontend(settingsStore.llmConfigs),
  preferences: settingsStore.preferences,
}))

// 4. `hasChanges` 计算属性，现在会比较完整的 draft 和 originalState
const hasChanges = computed(() => {
  return JSON.stringify(draft.value) !== JSON.stringify(originalState.value)
})

// 5. 关闭模态框的函数
function closeSettings() {
  router.push('/')
}

// 6. 保存所有更改的函数
function handleSave() {
  if (hasChanges.value) {
    // 保存对话和模型配置 (需要转换回后端格式)
    settingsStore.saveRemoteSettings({
      conversation: draft.value.conversation,
      llm: frontendToBackend(draft.value.models),
    })

    // 调用 serviceStore 的新 action 进行统一保存。
    serviceStore.saveAppConfig({
      service: draft.value.service,
      preferences: draft.value.preferences,
    })

    // 保存应用偏好
    settingsStore.savePreferences(draft.value.preferences)
  }
  closeSettings()
}

// 7. 更新导航栏，包含所有四个项目
const navItems = [
  { path: '/settings/connection', icon: IconServiceConnection, label: '服务连接' },
  { path: '/settings/conversation', icon: IconConversation, label: '对话设定' },
  { path: '/settings/model', icon: IconModel, label: '模型设定' },
  { path: '/settings/preferences', icon: IconPreferences, label: '应用偏好' },
]
</script>

<template>
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
    <div
      class="w-[800px] h-[600px] bg-white/70 backdrop-blur-xl rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- 标题栏 -->
      <header class="flex-shrink-0 flex items-center justify-between p-3 border-b border-black/10">
        <h1 class="text-lg font-semibold text-gray-800 ml-2">设置</h1>
        <button
          @click="closeSettings"
          class="p-2 text-gray-500 hover:bg-black/10 rounded-full transition-colors"
        >
          <IconClose :size="20" />
        </button>
      </header>

      <!-- 主体内容 -->
      <div class="flex flex-grow overflow-hidden">
        <!-- 左侧导航 -->
        <nav class="w-[200px] flex-shrink-0 bg-black/5 p-4 space-y-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 transition-colors hover:bg-black/10"
            active-class="bg-blue-100 text-blue-700 font-semibold"
          >
            <component :is="item.icon" :size="20" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <!-- 右侧内容区 -->
        <main class="flex-grow flex flex-col overflow-hidden">
          <div class="flex-grow p-6 overflow-y-auto">
            <RouterView v-slot="{ Component }">
              <Transition name="content-fade" mode="out-in">
                <!-- 
                  将完整的 draft 作为 v-model 传递给子组件。
                  每个子组件(如ServiceConnection.vue, ConversationSettings.vue) 
                  内部只会修改 draft 中属于自己的那一部分，例如 draft.service 或 draft.conversation。
                -->
                <component :is="Component" v-model:draft="draft" />
              </Transition>
            </RouterView>
          </div>

          <!-- 底部操作栏 -->
          <footer
            class="flex-shrink-0 flex justify-end items-center space-x-4 p-4 border-t border-black/10"
          >
            <button
              @click="closeSettings"
              class="px-4 py-2 rounded-md hover:bg-black/10 transition-colors"
            >
              取消
            </button>
            <button
              @click="handleSave"
              :disabled="!hasChanges"
              class="px-4 py-2 rounded-md bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              保存更改
            </button>
          </footer>
        </main>
      </div>
    </div>
  </div>
</template>
