import path from 'path';
import { app, BrowserWindow } from 'electron';
import { closeDatabase, initDatabase } from './database';
import { registerIpcHandlers } from './ipc';

app.setPath('userData', path.join(app.getPath('appData'), 'ZSEnterprises'));
app.setAppUserModelId('com.zsenterprises.manager');

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    title: 'ZS Enterprises Manager',
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
    return;
  }

  void window.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  try {
    const database = initDatabase();
    console.log(`SQLite database: ${database.name}`);
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
  }

  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
