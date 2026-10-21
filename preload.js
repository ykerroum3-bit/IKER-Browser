const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('iker', {
  newTab: (url, isPrivate) => ipcRenderer.invoke('new-tab', url, isPrivate),
  activateTab: id => ipcRenderer.invoke('activate-tab', id),
  closeTab: id => ipcRenderer.invoke('close-tab', id),
  navigate: url => ipcRenderer.invoke('navigate', url),
  back: () => ipcRenderer.invoke('back'),
  forward: () => ipcRenderer.invoke('forward'),
  reload: () => ipcRenderer.invoke('reload'),
  home: () => ipcRenderer.invoke('home'),
  toggleAdblock: enabled => ipcRenderer.invoke('toggle-adblock', enabled),
  getAdblock: () => ipcRenderer.invoke('get-adblock'),
  getPageText: () => ipcRenderer.invoke('get-page-text'),
  openExternal: url => ipcRenderer.invoke('open-external', url),
  onTabs: cb => ipcRenderer.on('tabs-updated', (_e, tabs) => cb(tabs)),
  onNavState: cb => ipcRenderer.on('nav-state', (_e, state) => cb(state))
});
