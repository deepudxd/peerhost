const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { checkDocker } = require("./dockerService");
const {
  containerExists,
  createContainer,
  startContainer,
  stopContainer
} = require("./dockerService");
const { getContainerStatus } = require("./dockerService");

let mainWindow;

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
  createWindow();

  ipcMain.handle("check-docker", async () => {
    return await checkDocker();
  });
});
  
  ipcMain.handle("start-server", async () => {
  const exists = await containerExists();
  if (!exists) {
    await createContainer();
  } else {
    await startContainer();
  }
  return true;
});

ipcMain.handle("stop-server", async () => {
  await stopContainer();
  return true;
});

ipcMain.handle("get-server-status", async () => {
  return await getContainerStatus();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});