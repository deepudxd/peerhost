const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

let syncthingProcess = null;

function startSyncthing() {
  const exePath = path.join(__dirname, "bin", "syncthing", "syncthing.exe");

  const configDir = path.join(
    os.homedir(),
    "AppData",
    "Roaming",
    "PeerHost",
    "syncthing"
  );

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  syncthingProcess = spawn(exePath, [
    "--home",
    configDir,
    "--no-browser",
    "--gui-address=127.0.0.1:8384"
  ]);

  syncthingProcess.stdout.on("data", data => {
    console.log("Syncthing:", data.toString());
  });

  syncthingProcess.stderr.on("data", data => {
    console.error("Syncthing Error:", data.toString());
  });
}

function stopSyncthing() {
  if (syncthingProcess) {
    syncthingProcess.kill();
    syncthingProcess = null;
  }
}

module.exports = { startSyncthing, stopSyncthing };