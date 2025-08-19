<script setup lang="ts">
import { showDesktopNotification } from '@/platform/desktop'

function handleSend() {
  const message = 'Hello from the Chat View with Tailwind!'
  console.log('Sending message...')
  showDesktopNotification(message)
}
</script>

<template>
  <!-- 
    使用 Tailwind CSS 来给页面添加样式：
    - h-screen: 高度占满整个屏幕
    - bg-gray-100: 浅灰色背景
    - dark:bg-slate-900: 在暗黑模式下，使用深石板色背景
    - flex flex-col items-center justify-center: 使用 flex 布局，让内容垂直水平居中
  -->
  <div class="flex h-screen flex-col items-center justify-center bg-gray-100 dark:bg-slate-900">
    <!--
      - text-4xl: 字体大小
      - font-bold: 字体加粗
      - text-slate-800: 深石板色文字
      - dark:text-white: 在暗黑模式下，使用白色文字
      - mb-6: margin-bottom，添加一些下边距
    -->
    <h1 class="mb-6 text-4xl font-bold text-slate-800 dark:text-white">MiraMate Chat</h1>

    <!--
      - bg-sky-500: 天蓝色背景
      - text-white: 白色文字
      - font-semibold: 中等粗细字体
      - px-6 py-3: 内边距 (padding)，x轴和y轴
      - rounded-lg: 大圆角
      - transition-all: 所有属性变化都有过渡效果
      - hover:bg-sky-600: 鼠标悬停时，背景色变深
      - active:scale-95: 鼠标点击时，按钮缩小一点点，提供反馈
    -->
    <button
      @click="handleSend"
      class="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white transition-all hover:bg-sky-600 active:scale-95"
    >
      Send Test Message
    </button>
  </div>
</template>
