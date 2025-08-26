import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'

// 使用函数形式以便按命令区分环境
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    // 关键修改：生产环境用相对路径，避免在 file:// 协议下加载 /assets 失败
    base: isDev ? '/' : './',

    plugins: [
      vue(),
      electron({
        main: {
          entry: 'electron/main.ts',
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
        renderer: {},
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // 可保持默认 build，其它不改，保证最小修改
    // build: { }
  }
})
