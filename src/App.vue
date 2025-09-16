<script setup lang="ts">
// 只需要从 vue-router 导入 RouterView
import { RouterView } from 'vue-router'
import { useServiceStore } from './core/stores/service'

const serviceStore = useServiceStore()
serviceStore.loadAppConfig()
</script>

<template>
  <RouterView />
</template>

<style></style>
