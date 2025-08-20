<script setup lang="ts">
import IconSettings from '@/components/icons/IconSettings.vue'
import avatarImage from '@/assets/images/avatar.png'
</script>

<template>
  <!-- backdrop-blur-sm: 提供背景模糊效果，增加质感 -->
  <!-- z-10: 确保它在消息列表之上 -->
  <header
    class="flex-shrink-0 flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm z-10"
  >
    <div class="flex items-center space-x-3">
      <!-- AI头像 -->
      <img :src="avatarImage" alt="Avatar" class="w-10 h-10 rounded-full" />
      <div>
        <h1 class="font-semibold text-gray-800">小梦</h1>
        <p class="text-sm text-gray-600 flex items-center">
          <span class="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
          正在输入中......
        </p>
      </div>
    </div>

    <!-- 设置按钮 -->
    <button class="text-gray-500 hover:text-gray-800 transition-colors">
      <IconSettings :size="24" />
    </button>
  </header>
</template>
