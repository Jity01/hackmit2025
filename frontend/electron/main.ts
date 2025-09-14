import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const isDev = !!process.env.VITE_DEV_SERVER_URL

let win: BrowserWindow | null = null

async function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, x: 100, y: 80, center: true,
    backgroundColor: '#ffffff',
    show: false,                       // <— create hidden, show when ready
    titleBarStyle: 'hiddenInset',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  })

  win.once('ready-to-show', () => {
    win!.setAlwaysOnTop(true, 'screen-saver')
    win!.show()
    win!.focus()
    setTimeout(() => win?.setAlwaysOnTop(false), 800)
  })

  // if load fails (dev server not ready), retry
  win.webContents.on('did-fail-load', () => {
    if (isDev) setTimeout(() => win?.loadURL(process.env.VITE_DEV_SERVER_URL!), 500)
  })

  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL!)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = new URL('../renderer/dist/index.html', import.meta.url).toString()
    await win.loadURL(indexPath)
  }

  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
}

app.whenReady().then(createWindow)
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
