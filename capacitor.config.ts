import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.contrue.miramate',
  appName: 'MiraMate',
  webDir: 'dist',
  server: {
    // 使用 http 以避免从 https 起源到 http(10.0.2.2) 的混合内容被拦截
    androidScheme: 'http',
  },
}

export default config
