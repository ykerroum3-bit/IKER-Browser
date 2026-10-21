const { app, BrowserWindow, BrowserView, ipcMain, session, shell } = require('electron');
const path = require('path');

let win;
let views = new Map();
let activeId = null;
let nextId = 1;
let privateMode = false;
let adBlockEnabled = true;

const blockedPatterns = [
  /doubleclick\.net/i, /googlesyndication\.com/i, /googleadservices\.com/i,
  /adservice\.google\./i, /adnxs\.com/i, /taboola\.com/i, /outbrain\.com/i,
  /popads\.net/i, /adroll\.com/i, /criteo\.com/i
];

function isBlocked(url) {
  return blockedPatterns.some(p => p.test(url));
}

function configureSession(sess) {
  sess.webRequest.onBeforeRequest((details, callback) => {
    if (adBlockEnabled && isBlocked(details.url)) return callback({ cancel: true });
    callback({});
  });
  sess.setPermissionRequestHandler((_wc, permission, callback) => {
    // Refuser par défaut les permissions sensibles dans cette première version.
    callback(['fullscreen'].includes(permission));
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    backgroundColor: '#090b12',
    title: 'IKER Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.loadFile('index.html');
  win.on('resize', layoutActiveView);
}

function makeView(isPrivate = false) {
  const id = String(nextId++);
  const partition = isPrivate ? `temp:iker-private-${id}` : 'persist:iker-main';
  const sess = session.fromPartition(partition, { cache: !isPrivate });
  configureSession(sess);
  const view = new BrowserView({
    webPreferences: {
      session: sess,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });
  views.set(id, { view, private: isPrivate, url: 'https://www.google.com', title: 'Nouvel onglet' });
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      createTab(url, isPrivate);
    } else {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  view.webContents.on('page-title-updated', (_e, title) => {
    const entry = views.get(id);
    if (entry) entry.title = title;
    sendTabs();
  });
  view.webContents.on('did-navigate', (_e, url) => {
    const entry = views.get(id);
    if (entry) entry.url = url;
    if (activeId === id) win.webContents.send('nav-state', navState());
    sendTabs();
  });
  view.webContents.on('did-navigate-in-page', (_e, url) => {
    const entry = views.get(id);
    if (entry) entry.url = url;
    if (activeId === id) win.webContents.send('nav-state', navState());
  });
  return id;
}

function layoutActiveView() {
  if (!win || !activeId || !views.has(activeId)) return;
  const { view } = views.get(activeId);
  const [width, height] = win.getContentSize();
  // Header chrome is 118px high; content view fills the remaining area.
  view.setBounds({ x: 0, y: 118, width, height: Math.max(100, height - 118) });
  view.setAutoResize({ width: true, height: true });
}

function navState() {
  if (!activeId || !views.has(activeId)) return {};
  const { view, private: isPrivate, url } = views.get(activeId);
  return {
    id: activeId, url: view.webContents.getURL() || url,
    canGoBack: view.webContents.canGoBack(),
    canGoForward: view.webContents.canGoForward(),
    loading: view.webContents.isLoading(),
    private: isPrivate
  };
}

function sendTabs() {
  if (!win || win.isDestroyed()) return;
  const tabs = [...views.entries()].map(([id, e]) => ({
    id, title: e.title || 'Nouvel onglet', url: e.view.webContents.getURL() || e.url,
    private: e.private, active: id === activeId
  }));
  win.webContents.send('tabs-updated', tabs);
}

function activateTab(id) {
  if (!views.has(id)) return;
  if (activeId && views.has(activeId)) win.removeBrowserView(views.get(activeId).view);
  activeId = id;
  win.addBrowserView(views.get(id).view);
  layoutActiveView();
  win.webContents.send('nav-state', navState());
  sendTabs();
}

function createTab(url = 'https://www.google.com', isPrivate = privateMode) {
  const id = makeView(isPrivate);
  activateTab(id);
  navigate(id, url);
  return id;
}

function normalizeAddress(input) {
  const value = String(input || '').trim();
  if (!value) return 'https://www.google.com';
  if (/^(https?:\/\/|file:\/\/)/i.test(value)) return value;
  if (/^localhost(:\d+)?([/].*)?$/i.test(value) || /^[\w.-]+\.[a-z]{2,}(:\d+)?([/].*)?$/i.test(value)) {
    return 'https://' + value;
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(value);
}

function navigate(id, input) {
  if (!views.has(id)) return;
  const url = normalizeAddress(input);
  views.get(id).url = url;
  views.get(id).view.webContents.loadURL(url).catch(() => {});
  if (activeId === id) win.webContents.send('nav-state', navState());
}

ipcMain.handle('new-tab', (_e, url, isPrivate) => createTab(url || 'https://www.google.com', !!isPrivate));
ipcMain.handle('activate-tab', (_e, id) => activateTab(String(id)));
ipcMain.handle('close-tab', (_e, id) => {
  id = String(id);
  if (!views.has(id)) return;
  const entry = views.get(id);
  if (activeId === id) {
    win.removeBrowserView(entry.view);
    activeId = null;
  }
  entry.view.webContents.close();
  views.delete(id);
  const remaining = [...views.keys()];
  if (!remaining.length) createTab();
  else if (!activeId) activateTab(remaining[remaining.length - 1]);
  sendTabs();
});
ipcMain.handle('navigate', (_e, input) => navigate(activeId, input));
ipcMain.handle('back', () => { if (activeId && views.get(activeId).view.webContents.canGoBack()) views.get(activeId).view.webContents.goBack(); });
ipcMain.handle('forward', () => { if (activeId && views.get(activeId).view.webContents.canGoForward()) views.get(activeId).view.webContents.goForward(); });
ipcMain.handle('reload', () => { if (activeId) views.get(activeId).view.webContents.reload(); });
ipcMain.handle('home', () => navigate(activeId, 'https://www.google.com'));
ipcMain.handle('toggle-adblock', (_e, enabled) => { adBlockEnabled = !!enabled; return adBlockEnabled; });
ipcMain.handle('get-adblock', () => adBlockEnabled);
ipcMain.handle('get-page-text', () => {
  if (!activeId) return '';
  return views.get(activeId).view.webContents.executeJavaScript(
    'document.body ? document.body.innerText.slice(0,12000) : ""'
  ).catch(() => '');
});
ipcMain.handle('open-external', (_e, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) shell.openExternal(url);
});

app.whenReady().then(() => {
  configureSession(session.fromPartition('persist:iker-main'));
  createWindow();
  createTab();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow(); createTab(); } });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
