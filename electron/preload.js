const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  checkDocker: () => ipcRenderer.invoke("check-docker"),
  startServer: () => ipcRenderer.invoke("start-server"),
  stopServer: () => ipcRenderer.invoke("stop-server"),
  getServerStatus: () => ipcRenderer.invoke("get-server-status"),
});