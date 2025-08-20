<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/core/stores/settings'
import IconConversation from '@/components/icons/IconConversation.vue'
import IconModel from '@/components/icons/IconModel.vue'
import IconPreferences from '@/components/icons/IconPreferences.vue'
import IconClose from '@/components/icons/IconClose.vue'

const router = useRouter()
const settingsStore = useSettingsStore()

// 创建一个本地的、可编辑的草稿状态
const draft = ref({
  conversation: { ...settingsStore.conversation },
  primaryModel: { ...settingsStore.primaryModel },
  secondaryModel: { ...settingsStore.secondaryModel },
  preferences: { ...settingsStore.preferences },
})

// 深度比较草稿和原始store状态，判断是否有改动
const hasChanges = computed(() => {
  return (
    JSON.stringify(draft.value) !==
    JSON.stringify({
      conversation: settingsStore.conversation,
      primaryModel: settingsStore.primaryModel,
      secondaryModel: settingsStore.secondaryModel,
      preferences: settingsStore.preferences,
    })
  )
})

function closeSettings() {
  router.push('/')
}

function handleSave() {
  if (hasChanges.value) {
    settingsStore.saveSettings(draft.value)
  }
  closeSettings()
}

const navItems = [
  { path: '/settings/conversation', icon: IconConversation, label: '对话设定' },
  { path: '/settings/model', icon: IconModel, label: '模型设定' },
  { path: '/settings/preferences', icon: IconPreferences, label: '应用偏好' },
]
</script>

<template>
  <div class="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 flex items-center justify-center">
    <div
      class="w-[800px] h-[600px] bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- 标题栏 -->
      <header class="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-200">
        <h1 class="text-lg font-semibold text-gray-800 ml-2">设置</h1>
        <button
          @click="closeSettings"
          class="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
        >
          <IconClose :size="20" />
        </button>
      </header>

      <!-- 主体内容 -->
      <div class="flex flex-grow overflow-hidden">
        <!-- 左侧导航 -->
        <nav class="w-[200px] flex-shrink-0 bg-gray-50 p-4">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 transition-colors hover:bg-white hover:shadow-sm"
            active-class="bg-blue-50 text-blue-600 font-semibold shadow-sm"
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
                <!-- 将draft作为prop传递给子组件 -->
                <component :is="Component" v-model:draft="draft" />
              </Transition>
            </RouterView>
          </div>

          <!-- 底部操作栏 -->
          <footer
            class="flex-shrink-0 flex justify-end items-center space-x-4 p-4 border-t border-gray-200"
          >
            <button
              @click="closeSettings"
              class="px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
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
