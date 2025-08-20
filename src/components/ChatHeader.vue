<script setup lang="ts">
import IconSettings from '@/components/icons/IconSettings.vue'

// 1. 定义这个组件可以发出的事件（信号）
const emit = defineEmits(['openSettings'])
</script>

<template>
  <header
    class="flex-shrink-0 flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm z-10"
  >
    <div class="flex items-center space-x-3">
      <img src="https://i.pravatar.cc/40" alt="Avatar" class="w-10 h-10 rounded-full" />
      <div>
        <h1 class="font-semibold text-gray-800">小梦</h1>
        <p class="text-sm text-gray-600 flex items-center">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
          正在输入中......
        </p>
      </div>
    </div>

    <!-- 2. 当按钮被点击时，发出 'openSettings' 信号 -->
    <button
      @click="emit('openSettings')"
      class="text-gray-500 hover:text-gray-800 transition-colors"
    >
      <IconSettings :size="24" />
    </button>
  </header>
</template>
