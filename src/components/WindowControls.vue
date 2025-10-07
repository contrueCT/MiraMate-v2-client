<script setup lang="ts">
import IconMinimize from './icons/IconMinimize.vue'
import IconMaximize from './icons/IconMaximize.vue'
import IconClose from './icons/IconClose.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const isMaximized = ref(false)

function handleMinimize() {
  console.log('Minimize button clicked')
  window.electronAPI?.minimizeWindow?.()
}

function handleMaximize() {
  console.log('Maximize button clicked, current state:', isMaximized.value)
  window.electronAPI?.maximizeWindow?.()
}

function handleClose() {
  console.log('Close button clicked')
  window.electronAPI?.closeWindow?.()
}

onMounted(() => {
  console.log('WindowControls component mounted')
  // 监听窗口最大化状态变化
  window.electronAPI?.onWindowMaximized?.((maximized) => {
    console.log('Window maximized state changed:', maximized)
    isMaximized.value = maximized
  })
})

onUnmounted(() => {
  console.log('WindowControls component unmounted')
  window.electronAPI?.removeWindowMaximizedListener?.()
})
</script>

<template>
  <div class="window-controls">
    <div class="drag-area"></div>
    <div class="control-buttons">
      <button @click="handleMinimize" class="control-button minimize" title="最小化">
        <IconMinimize :size="12" />
      </button>
      <button
        @click="handleMaximize"
        class="control-button maximize"
        :title="isMaximized ? '还原' : '最大化'"
      >
        <IconMaximize :size="12" />
      </button>
      <button @click="handleClose" class="control-button close" title="关闭">
        <IconClose :size="12" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.window-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  width: 100%;
  -webkit-app-region: drag;
}

.drag-area {
  flex: 1;
  height: 100%;
}

.control-buttons {
  display: flex;
  gap: 6px;
  padding-right: 10px;
  -webkit-app-region: no-drag;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(107, 114, 128, 0.9);
}

.control-button:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: rgba(75, 85, 99, 1);
}

.close:hover {
  background-color: rgba(232, 17, 35, 0.9);
  color: white;
}
</style>
