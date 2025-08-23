<script setup lang="ts">
import { useServiceStore } from '@/core/stores/service'
import { storeToRefs } from 'pinia'

const draft = defineModel<any>('draft')

const serviceStore = useServiceStore()
const { connectionStatus, connectionError } = storeToRefs(serviceStore)

function handleTestConnection() {
  serviceStore.testConnection()
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold">后端服务配置</h2>
      <p class="text-sm text-gray-600 mt-1">在这里配置你的自定义后端服务，以便与AI进行通信。</p>
    </div>

    <div>
      <label class="font-semibold">网络环境</label>
      <div class="flex bg-gray-200 p-1 rounded-md mt-1 w-fit">
        <button
          @click="draft.service.env = 'public'"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            draft.service.env === 'public' ? 'bg-white shadow' : '',
          ]"
        >
          公网
        </button>
        <button
          @click="draft.service.env = 'local'"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            draft.service.env === 'local' ? 'bg-white shadow' : '',
          ]"
        >
          内网/本地
        </button>
      </div>
    </div>

    <div>
      <label class="font-semibold">服务地址 (Endpoint URL)</label>
      <input
        type="text"
        v-model="draft.service.url"
        placeholder="例如: https://api.yourdomain.com"
        class="w-full mt-1 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <div v-if="draft.service.env === 'public'">
      <label class="font-semibold">鉴权密钥 (Authorization Key)</label>
      <input
        type="password"
        v-model="draft.service.key"
        class="w-full mt-1 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <div class="flex items-center space-x-4">
      <button
        @click="handleTestConnection"
        class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
      >
        {{ connectionStatus === 'testing' ? '测试中...' : '连接测试' }}
      </button>
      <div
        v-if="connectionStatus !== 'unconfigured' && connectionStatus !== 'testing'"
        class="text-sm flex items-center"
      >
        <span v-if="connectionStatus === 'success'" class="text-green-600">🟢 连接成功！</span>
        <span v-if="connectionStatus === 'failed'" class="text-red-600"
          >🔴 连接失败: {{ connectionError }}</span
        >
      </div>
    </div>
  </div>
</template>
