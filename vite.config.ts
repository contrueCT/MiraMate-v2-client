import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import electron from 'vite-plugin-electron' // 注意这里的 '/renderer'
import renderer from 'vite-plugin-electron-renderer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    electron([
      {
        // 主进程配置
        entry: 'electron/main.ts',
      },
      {
        // 预加载脚本配置
        entry: 'electron/preload.ts',
        onstart(options) {
          // 预加载脚本编译完成后，通知渲染进程重新加载
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
