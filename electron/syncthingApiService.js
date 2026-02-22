const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

const configDir = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  "PeerHost",
  "syncthing"
);

const configPath = path.join(configDir, "config.xml");

function getApiKey() {
  const xml = fs.readFileSync(configPath, "utf-8");
  const match = xml.match(/<apikey>(.*?)<\/apikey>/);
  return match ? match[1] : null;
}

function getClient() {
  const apiKey = getApiKey();

  return axios.create({
    baseURL: "http://127.0.0.1:8384/rest",
    headers: {
      "X-API-Key": apiKey
    }
  });
}

async function getSystemStatus() {
  const client = getClient();
  const res = await client.get("/system/status");
  return res.data;
}

async function getConfig() {
  const client = getClient();
  const res = await client.get("/config");
  return res.data;
}

async function setConfig(config) {
  const client = getClient();
  await client.put("/config", config);
}

async function restartSyncthing() {
  const client = getClient();
  await client.post("/system/restart");
}

async function ensureFolders() {
  try {
    const config = await getConfig();

    const worldPath = path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "PeerHost",
      "world"
    );

    const lockPath = path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "PeerHost",
      "lock"
    );

    if (!fs.existsSync(worldPath)) {
      fs.mkdirSync(worldPath, { recursive: true });
    }

    if (!fs.existsSync(lockPath)) {
      fs.mkdirSync(lockPath, { recursive: true });
    }

    // 🔥 FIX: Only send deviceID, not full device objects
    const allDevices = config.devices.map(d => ({
      deviceID: d.deviceID
    }));

    const worldExists = config.folders.find(f => f.id === "world");
    const lockExists = config.folders.find(f => f.id === "lock");

    if (!worldExists) {
      config.folders.push({
        id: "world",
        label: "PeerHost World",
        path: worldPath,
        type: "sendreceive",
        devices: allDevices
      });
    }

    if (!lockExists) {
      config.folders.push({
        id: "lock",
        label: "PeerHost Lock",
        path: lockPath,
        type: "sendonly",
        devices: allDevices
      });
    }

    await setConfig(config);
    await restartSyncthing();

    console.log("Syncthing folders configured successfully.");

  } catch (err) {
    console.error(
      "ensureFolders failed:",
      err.response?.data || err.message
    );
  }
}

module.exports = {
  getSystemStatus,
  getConfig,
  setConfig,
  restartSyncthing,
  ensureFolders
};