import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url' // 我们依然需要这两个工具

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // 直接在这里动态计算 preload.js 的绝对路径
      // 不再依赖任何 __dirname 变量
      preload: path.join(path.dirname(fileURLToPath(import.meta.url)), 'preload.js'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // 生产模式下，同样直接计算 index.html 的绝对路径
    mainWindow.loadFile(
      path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html'),
    )
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    process.exit(0)
  }
})
