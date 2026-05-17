const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Notifications
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  
  // Printing
  printInvoice: () => ipcRenderer.send('print-invoice'),
  
  // Settings
  getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) => ipcRenderer.send('set-store-value', key, value),
  
  // Offline/Online status
  onNetworkStatusChange: (callback) => ipcRenderer.on('network-status', (_event, status) => callback(status)),

  // Listeners for menu
  onMenuNavigate: (callback) => ipcRenderer.on('menu-navigate', (_event, path) => callback(path)),
});
