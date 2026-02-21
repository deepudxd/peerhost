const { exec } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");

const appDataPath = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  "PeerHost"
);

const worldPath = path.join(appDataPath, "world");

if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath);
}

if (!fs.existsSync(worldPath)) {
  fs.mkdirSync(worldPath);
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function checkDocker() {
  return runCommand('docker version --format "{{.Server.Version}}"')
    .then(() => true)
    .catch(() => false);
}

async function containerExists() {
  try {
    const result = await runCommand(
      'docker ps -a --filter "name=peerhost-mc" --format "{{.Names}}"'
    );
    return result.includes("peerhost-mc");
  } catch {
    return false;
  }
}

async function createContainer() {
  return runCommand(
    `docker run -d --name peerhost-mc -p 25565:25565 -e EULA=TRUE -e TYPE=PAPER -e MEMORY=4G -v "${worldPath}:/data" --restart unless-stopped itzg/minecraft-server`
  );
}

async function startContainer() {
  return runCommand("docker start peerhost-mc");
}

async function stopContainer() {
  try {
    const exists = await containerExists();
    if (!exists) return "No container to stop";
    return await runCommand("docker stop peerhost-mc");
  } catch (err) {
    return err;
  }
}

async function getContainerStatus() {
  try {
    const result = await runCommand(
      'docker ps -a --filter "name=peerhost-mc" --format "{{.Status}}"'
    );

    if (!result) return "not_created";

    if (result.includes("Up")) return "running";

    if (result.includes("Exited")) return "stopped";

    return "unknown";
  } catch {
    return "not_created";
  }
}

function streamLogs(callback) {
  const logProcess = require("child_process").spawn(
    "docker",
    ["logs", "-f", "peerhost-mc"]
  );

  logProcess.stdout.on("data", (data) => {
    callback(data.toString());
  });

  logProcess.stderr.on("data", (data) => {
    callback(data.toString());
  });

  return logProcess;
}


module.exports = {
  checkDocker,
  containerExists,
  createContainer,
  startContainer,
  stopContainer,
  getContainerStatus,
  streamLogs
};