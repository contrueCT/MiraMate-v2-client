import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url' // 必须导入

// --- ESM-safe __dirname an __filename ---
// 这是在 "type": "module" 项目中获取当前目录路径的唯一正确方法
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// -----------------------------------------

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// --- 配置文件路径 ---
const userDataPath = app.getPath('userData')
const configFilePath = path.join(userDataPath, 'config.json')
console.log('User data path:', userDataPath)
console.log('Config file will be saved to:', configFilePath)

// --- IPC 通信处理 ---
ipcMain.handle('config:get', async () => {
  try {
    await fs.access(configFilePath)
    const data = await fs.readFile(configFilePath, 'utf-8')
    return data
  } catch (error) {
    return null
  }
})

ipcMain.handle('config:set', async (event, configString: string) => {
  try {
    await fs.writeFile(configFilePath, configString, 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Failed to write config file:', error)
    return { success: false, error: (error as Error).message }
  }
})

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      // 使用我们刚刚创建的、ESM安全的 __dirname
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // 同样，使用ESM安全的 __dirname 来定位生产环境的 index.html
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    process.exit(0)
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
