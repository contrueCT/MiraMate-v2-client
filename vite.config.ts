import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.ts',
        // (可选) 为主进程也强制输出mjs
        vite: {
          build: {
            rollupOptions: {
              output: {
                entryFileNames: '[name].mjs',
              },
            },
          },
        },
      },
      preload: {
        input: fileURLToPath(new URL('./electron/preload.ts', import.meta.url)),
        // 核心改动在这里：
        // 强制 Vite 将预加载脚本打包成 ESM 格式，并输出为 .mjs 文件
        vite: {
          build: {
            rollupOptions: {
              output: {
                // [name] 会被替换为 'preload'
                entryFileNames: '[name].mjs',
              },
            },
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
