const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  checkDocker: () => ipcRenderer.invoke("check-docker"),
  startServer: () => ipcRenderer.invoke("start-server"),
  stopServer: () => ipcRenderer.invoke("stop-server"),
  getServerStatus: () => ipcRenderer.invoke("get-server-status"),

  startLogStream: () => ipcRenderer.send("start-log-stream"),
  stopLogStream: () => ipcRenderer.send("stop-log-stream"),

  onLog: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("server-log", listener);
    return () => ipcRenderer.removeListener("server-log", listener);
  },


  onServerReady: (callback) => {
  const listener = () => callback();
  ipcRenderer.on("server-ready", listener);
  return () => ipcRenderer.removeListener("server-ready", listener);
},
});