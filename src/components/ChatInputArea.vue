<script setup lang="ts">
import { ref } from 'vue'
import IconMic from '@/components/icons/IconMic.vue'
import IconEmoji from '@/components/icons/IconEmoji.vue'
import IconImage from '@/components/icons/IconImage.vue'
import IconSend from '@/components/icons/IconSend.vue'

const inputText = ref('')

const emit = defineEmits(['sendMessage'])

function sendMessage() {
  if (!inputText.value.trim()) return
  emit('sendMessage', inputText.value)
  inputText.value = ''
}
</script>

<template>
  <!-- 整个输入区域：一个大的圆角白色卡片，带模糊和阴影 -->
  <div
    class="w-full bg-white/70 backdrop-blur-lg rounded-2xl p-3 shadow-lg transition-all duration-300 focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-gray-300/50"
  >
    <!-- 输入框 -->
    <!-- pb-10: 给输入框增加底部内边距，为底部的图标栏留出空间 -->
    <textarea
      v-model="inputText"
      placeholder="今天想聊点什么？"
      class="w-full h-16 bg-transparent border-none focus:ring-0 focus:outline-none resize-none placeholder:text-gray-400 pb-10"
      @keydown.enter.prevent="sendMessage"
    ></textarea>

    <!-- 操作栏：现在位于整个卡片的内部 -->
    <div class="flex items-center justify-between mt-1">
      <!-- 中间的动态效果 -->
      <div class="text-gray-400 text-sm animate-pulse">... s ... i ...</div>

      <!-- 右侧图标按钮 -->
      <div class="flex items-center space-x-2">
        <button class="p-2 text-gray-500 hover:bg-black/5 rounded-full transition-colors">
          <IconMic :size="22" />
        </button>
        <button class="p-2 text-gray-500 hover:bg-black/5 rounded-full transition-colors">
          <IconEmoji :size="22" />
        </button>
        <button class="p-2 text-gray-500 hover:bg-black/5 rounded-full transition-colors">
          <IconImage :size="22" />
        </button>
        <button
          @click="sendMessage"
          class="p-2 rounded-full transition-colors"
          :class="
            inputText.trim()
              ? 'text-blue-500 hover:bg-blue-100'
              : 'text-gray-400 cursor-not-allowed'
          "
          :disabled="!inputText.trim()"
        >
          <IconSend :size="22" />
        </button>
      </div>
    </div>
  </div>
</template>
