const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { checkDocker } = require("./dockerService");
const {
  containerExists,
  createContainer,
  startContainer,
  stopContainer,
  getContainerStatus,
  streamLogs,
} = require("./dockerService");
const { acquireLock, updateHeartbeat, releaseLock } = require("./lockService");
const { startSyncthing } = require("./syncthingService");
const { getSystemStatus } = require("./syncthingApiService");
const { ensureFolders } = require("./syncthingApiService");
let mainWindow;
let heartbeatInterval = null;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  startSyncthing();
  setTimeout(async () => {
  const status = await getSystemStatus();
  console.log("Syncthing Status:", status);
}, 5000);
  setTimeout(async () => {
  console.log("Calling ensureFolders...");
  await ensureFolders();
  console.log("Folders ensured.");
}, 8000);
  createWindow();

  ipcMain.handle("check-docker", async () => {
    return await checkDocker();
  });
});

ipcMain.handle("start-server", async () => {
  const lockResult = acquireLock();

  if (!lockResult.success) {
    return { success: false, reason: lockResult.reason };
  }

  const exists = await containerExists();

  if (!exists) {
    await createContainer();
  } else {
    await startContainer();
  }

  heartbeatInterval = setInterval(() => {
    updateHeartbeat();
  }, 10000);

  return { success: true };
});

ipcMain.handle("stop-server", async () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  await stopContainer();
  releaseLock();

  return { success: true };
});

ipcMain.handle("get-server-status", async () => {
  return await getContainerStatus();
});


ipcMain.on("start-log-stream", (event) => {
  const logProcess = streamLogs((log) => {
    console.log("LOG LINE:", log); // 🔥 add this
    event.sender.send("server-log", log);

    if (log.includes("Done (")) {
      console.log("Detected Donee line");
      event.sender.send("server-ready");
    }
  });

  event.sender.on("stop-log-stream", () => {
    logProcess.kill();
  });
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
