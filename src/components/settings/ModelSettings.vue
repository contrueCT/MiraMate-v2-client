<script setup lang="ts">
import ModelCard from './ModelCard.vue'
const draft = defineModel<any>('draft')
</script>
<template>
  <div class="space-y-8">
    <ModelCard
      v-model:modelConfig="draft.primaryModel"
      title="主模型"
      description="用于深度对话和复杂推理，建议使用性能最强的模型。"
    />
    <ModelCard
      v-model:modelConfig="draft.secondaryModel"
      title="次要模型"
      description="用于快速响应和简单任务，建议使用推理速度快的模型。"
    />
  </div>
</template>
