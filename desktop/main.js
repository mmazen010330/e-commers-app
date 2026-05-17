const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let tray;

function createWindow() {
  // Window state persistence
  const windowState = store.get('windowState') || {
    width: 1200,
    height: 800,
    isMaximized: false
  };

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Load the frontend app
  mainWindow.loadFile(path.join(__dirname, '../frontend/index.html'));

  // Save window state on resize/move/close
  ['resize', 'move', 'close'].forEach(event => {
    mainWindow.on(event, () => {
      if (!mainWindow.isMaximized()) {
        const bounds = mainWindow.getBounds();
        store.set('windowState', {
          ...bounds,
          isMaximized: mainWindow.isMaximized()
        });
      } else {
        store.set('windowState.isMaximized', true);
      }
    });
  });

  // Printing support
  ipcMain.on('print-invoice', (event) => {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      deviceName: ''
    });
  });
}

function createTray() {
  // Use a simple icon or build an empty one for now
  tray = new Tray(path.join(__dirname, 'icon.png')); // We will need an icon.png
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => { mainWindow.show(); } },
    { label: 'Settings', click: () => { mainWindow.webContents.send('menu-navigate', 'settings'); mainWindow.show(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('AuraShop E-Commerce');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  
  // Try to create tray, ignore if icon missing for now
  try {
    createTray();
  } catch (e) {
    console.log('Tray icon creation failed, maybe icon.png is missing.');
  }

  // Auto-launch setting
  const autoLaunch = store.get('settings.autoLaunch') || false;
  app.setLoginItemSettings({
    openAtLogin: autoLaunch
  });

  // Keyboard Shortcuts
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow.webContents.toggleDevTools();
  });
  globalShortcut.register('CommandOrControl+P', () => {
    mainWindow.webContents.print();
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC Handlers
ipcMain.on('show-notification', (event, { title, body }) => {
  const notificationsEnabled = store.get('settings.notifications') !== false; // Default true
  if (notificationsEnabled && Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('get-store-value', (event, key) => {
  return store.get(key);
});

ipcMain.on('set-store-value', (event, key, value) => {
  store.set(key, value);
  
  // Apply specific settings immediately
  if (key === 'settings.autoLaunch') {
    app.setLoginItemSettings({ openAtLogin: value });
  }
});
