const { app, BrowserWindow } = require('electron')
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false
    }
  })
  win.loadFile('index1.html')
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow)
