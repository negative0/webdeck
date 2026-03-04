import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data: any) => {
      const validChannels = ['toMain', 'start-server', 'stop-server', 'get-server-status', 'get-ip-address'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ['fromMain', 'server-status', 'ip-address', 'server-log', 'active-app-changed'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
  },
  // Contextual deck: listen for focused app changes
  onActiveAppChange: (callback: (appName: string) => void) => {
    ipcRenderer.on('active-app-changed', (_event, appName) => callback(appName));
  },
  // Contextual deck: capture currently focused app on demand
  getActiveApp: (): Promise<string> => {
    return ipcRenderer.invoke('get-active-app');
  },
});
