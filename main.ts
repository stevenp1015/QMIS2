import { app, BrowserWindow } from 'electron';
import * as path from 'path';

require("electron-reload")(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`),
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'), // Add preload script

    },
  });
  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.openDevTools();

  win.webContents.session.setDevicePermissionHandler((details: { deviceType: string }) => { 
    if (details.deviceType === 'midi') { 
      return true; // Allow MIDI device access
    }
    return false; // Deny other device types
  }); 
}

app.disableHardwareAcceleration();

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0)
    createWindow();
});