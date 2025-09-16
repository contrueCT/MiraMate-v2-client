<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  sender: 'ai' | 'user'
}>()

// 根据发送者动态计算样式
const bubbleClasses = computed(() => {
  if (props.sender === 'ai') {
    return 'bg-mira-ai-bubble text-gray-800 self-start'
  } else {
    return 'bg-mira-user-bubble text-gray-800 self-end'
  }
})
</script>

<template>
  <div class="flex" :class="{ 'justify-end': sender === 'user', 'justify-start': sender === 'ai' }">
    <div class="max-w-md md:max-w-lg px-4 py-2 rounded-xl shadow-sm" :class="bubbleClasses">
      <p>{{ text }}</p>
    </div>
  </div>
</template>
