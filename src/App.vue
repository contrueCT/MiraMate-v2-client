<script setup lang="ts">
// 只需要从 vue-router 导入 RouterView
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- 整个应用只有一个职责：显示当前路由匹配到的组件 -->
  <RouterView />
</template>

<style>
/* 你可以保留或删除默认的样式。为了一个干净的开始，我建议先删除它们。
   然后可以在 src/assets/base.css 或 main.css 中写入你自己的全局基础样式。*/
</style>
