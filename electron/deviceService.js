const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const appDataPath = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  "PeerHost"
);

const deviceFile = path.join(appDataPath, "device.json");

function ensureAppDir() {
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
  }
}

function getDeviceId() {
  ensureAppDir();

  if (fs.existsSync(deviceFile)) {
    const data = JSON.parse(fs.readFileSync(deviceFile));
    return data.id;
  }

  const id = crypto.randomUUID();

  fs.writeFileSync(deviceFile, JSON.stringify({ id }));

  return id;
}

module.exports = { getDeviceId };