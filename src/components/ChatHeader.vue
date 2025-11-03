// src/components/ChatHeader.vue
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/core/stores/chat'
import { useSettingsStore } from '@/core/stores/settings'
import { useServiceStore } from '@/core/stores/service'
import IconSettings from '@/components/icons/IconSettings.vue'
import avatarDefault from '@/assets/images/avatar.png'

const emit = defineEmits(['openSettings'])

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const serviceStore = useServiceStore()

const { aiStatus } = storeToRefs(chatStore)
const { wsConnected } = storeToRefs(serviceStore)
const { conversation } = storeToRefs(settingsStore)

const statusText = computed(() => {
  if (!wsConnected.value) return '离线'
  switch (aiStatus.value) {
    case 'thinking':
      return '正在思考...'
    case 'typing':
      return '正在输入中...'
    case 'processing':
      return '正在整理思绪...'
    case 'idle':
    default:
      return '在线'
  }
})

// ===== 自定义头像（本地持久化，不同步后端） =====
const AVATAR_STORAGE_KEY = 'mira-ai-avatar'
const avatarDataUrl = ref<string | null>(null)
const avatarSrc = computed(() => avatarDataUrl.value || (avatarDefault as unknown as string))
const fileInputRef = ref<HTMLInputElement | null>(null)

// 移动端长按重置（桌面端可用右键重置）
let longPressTimer: number | null = null
function onAvatarTouchStart() {
  longPressTimer = window.setTimeout(() => {
    resetAvatar()
  }, 700)
}
function onAvatarTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(AVATAR_STORAGE_KEY)
    if (saved) avatarDataUrl.value = saved
  } catch {}
})

function triggerPickAvatar() {
  fileInputRef.value?.click()
}

function resetAvatar() {
  avatarDataUrl.value = null
  try {
    localStorage.removeItem(AVATAR_STORAGE_KEY)
  } catch {}
}

function onAvatarPicked(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    console.warn('请选择图片文件')
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const maxSize = 256
      let { width, height } = img
      const scale = Math.min(1, maxSize / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      avatarDataUrl.value = dataUrl
      try {
        localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl)
      } catch (e) {
        console.warn('保存头像到本地失败：', e)
      }
      input.value = ''
    }
    img.src = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <header
    class="flex-shrink-0 flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm z-10"
  >
    <div class="flex items-center space-x-3">
      <!-- 头像：点击选择；桌面右键/移动端长按重置为默认 -->
      <img
        :src="avatarSrc"
        alt="Avatar"
        class="w-10 h-10 rounded-full cursor-pointer select-none"
        title="点击更换头像（桌面右键/移动端长按重置为默认）"
        @click="triggerPickAvatar"
        @contextmenu.prevent="resetAvatar"
        @touchstart.passive="onAvatarTouchStart"
        @touchend.passive="onAvatarTouchEnd"
      />
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onAvatarPicked"
      />
      <div>
        <!-- 从 settings store 读取AI名称 -->
        <h1 class="font-semibold text-gray-800">{{ conversation.aiName }}</h1>
        <p class="text-sm text-gray-600 flex items-center">
          <span
            class="w-2 h-2 rounded-full mr-1.5"
            :class="wsConnected ? 'bg-green-500' : 'bg-gray-400'"
          ></span>
          <!-- 显示动态计算的状态文本 -->
          {{ statusText }}
        </p>
      </div>
    </div>
    <button
      @click="emit('openSettings')"
      class="text-gray-500 hover:text-gray-800 transition-colors"
    >
      <IconSettings :size="24" />
    </button>
  </header>
</template>
