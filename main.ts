import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false, // Remove default frame
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
  win.webContents.openDevTools();

  win.webContents.session.setDevicePermissionHandler(
    (details: { deviceType: string }) => {
      if (details.deviceType === "midi") {
        return true; // Allow MIDI device access
      }
      return false; // Deny other device types
    }
  );

  // Set up IPC handlers for window controls
  ipcMain.on("window-minimize", () => {
    win.minimize();
  });

  ipcMain.on("window-maximize", () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on("window-close", () => {
    win.close();
  });
}

app.disableHardwareAcceleration();

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
