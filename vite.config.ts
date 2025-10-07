import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'

// 使用函数形式以便按命令区分环境与模式
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'
  const env = loadEnv(mode, process.cwd(), '')
  const isMobile = mode === 'mobile' || env.VITE_PLATFORM === 'mobile'

  return {
    // 关键修改：生产环境用相对路径，避免在 file:// 协议下加载 /assets 失败
    base: isDev ? '/' : './',

    plugins: [
      vue(),
      // 移动端构建不引入 electron 插件，避免打包 electron 相关代码
      !isMobile &&
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
    define: {
      __MOBILE__: JSON.stringify(isMobile),
    },
    // 可保持默认 build，其它不改，保证最小修改
    // build: { }
  }
})
