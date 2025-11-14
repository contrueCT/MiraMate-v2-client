<script setup lang="ts">
import { computed } from 'vue'
import MarkdownRender from 'vue-renderer-markdown'
import 'vue-renderer-markdown/index.css'

const props = defineProps<{
  text: string
  sender: 'ai' | 'user'
  isStreaming?: boolean
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
    <div
      class="max-w-md md:max-w-lg px-4 py-2 rounded-xl shadow-sm markdown-body"
      :class="bubbleClasses"
    >
      <!-- AI 消息使用 Markdown 渲染；用户消息保持纯文本 -->
      <MarkdownRender
        v-if="sender === 'ai'"
        :content="text"
        :render-code-blocks-as-pre="false"
        :code-block-stream="true"
      />
      <p v-else>{{ text }}</p>
    </div>
  </div>
</template>

<style scoped>
/* 为 Markdown 内容添加基础样式 */
.markdown-body :deep(p) {
  margin: 0.5em 0;
}
.markdown-body :deep(p:first-child) {
  margin-top: 0;
}
.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}
.markdown-body :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}
.markdown-body :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5em 0;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.875em;
}
.markdown-body :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}
.markdown-body :deep(li) {
  margin: 0.25em 0;
}
.markdown-body :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #666;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 0.75em 0 0.5em 0;
  font-weight: 600;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 0.5em 0;
  width: 100%;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}
.markdown-body :deep(th) {
  background: rgba(0, 0, 0, 0.05);
  font-weight: 600;
}

/* Mermaid 图表样式 */
.markdown-body :deep(.mermaid) {
  margin: 1em 0;
  display: flex;
  justify-content: center;
  background: transparent;
}

.markdown-body :deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}
</style>
