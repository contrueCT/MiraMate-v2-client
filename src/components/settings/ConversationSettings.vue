<script setup lang="ts">
const draft = defineModel<any>('draft')
</script>
<template>
  <div class="space-y-6">
    <div>
      <label class="font-semibold">AI 的名称</label>
      <input
        type="text"
        v-model="draft.conversation.aiName"
        placeholder="例如：小梦"
        class="w-full mt-1 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    <div>
      <label class="font-semibold">AI 如何称呼你</label>
      <input
        type="text"
        v-model="draft.conversation.userAlias"
        placeholder="例如：亲爱的、主人、伙伴"
        class="w-full mt-1 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    <div>
      <label class="font-semibold">AI 的核心设定 (Persona)</label>
      <textarea
        v-model="draft.conversation.persona"
        rows="5"
        class="w-full mt-1 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
      <p class="text-sm text-gray-500 mt-1">为 TA 设定一个独特的性格、背景故事或说话风格。</p>
    </div>
    <button class="text-blue-500 hover:underline">恢复默认设定</button>
  </div>
</template>
