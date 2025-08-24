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

// 添加窗口控制相关的IPC监听器
ipcMain.on('window:minimize', (event) => {
  console.log('Minimize window requested')
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

// window:maximize 处理器现在在 createWindow 函数内部

ipcMain.on('window:close', (event) => {
  console.log('Close window requested')
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    frame: false, // 移除默认窗口边框
    webPreferences: {
      // 使用我们刚刚创建的、ESM安全的 __dirname
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // 手动跟踪窗口状态
  let windowMaximized = false

  // 添加窗口状态变化监听
  mainWindow.on('maximize', () => {
    console.log('Window maximized event triggered, sending to renderer')
    windowMaximized = true
    mainWindow.webContents.send('window:maximized', true)
  })

  mainWindow.on('unmaximize', () => {
    console.log('Window unmaximized event triggered, sending to renderer')
    windowMaximized = false
    mainWindow.webContents.send('window:maximized', false)
  })

  // 当页面加载完成后，发送当前窗口状态
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Page loaded, sending initial window state')
    const isMaximized = mainWindow.isMaximized()
    console.log('Initial window state:', isMaximized)
    windowMaximized = isMaximized
    mainWindow.webContents.send('window:maximized', isMaximized)
  })

  // 修改IPC处理器以使用手动跟踪的状态
  const originalMaximizeHandler = ipcMain.listeners('window:maximize')[0]
  if (originalMaximizeHandler) {
    ipcMain.removeListener('window:maximize', originalMaximizeHandler as any)
  }

  ipcMain.on('window:maximize', (event) => {
    console.log('Maximize window requested')
    if (event.sender !== mainWindow.webContents) return

    console.log('Window is currently maximized (tracked):', windowMaximized)

    if (windowMaximized) {
      console.log('Unmaximizing window')
      mainWindow.unmaximize()
    } else {
      console.log('Maximizing window')
      mainWindow.maximize()
    }
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
