// src/platform/desktop.ts
export function showDesktopNotification(message: string) {
  console.log(`[Desktop Notification]: ${message}`)
  // 以后这里会调用真正的Electron API
}
