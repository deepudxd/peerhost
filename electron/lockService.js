const fs = require("fs");
const path = require("path");
const os = require("os");
const { getDeviceId } = require("./deviceService");

const appDataPath = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  "PeerHost"
);

const lockFile = path.join(appDataPath, "lock.json");

const TIMEOUT = 60000; // 60 seconds

function now() {
  return Date.now();
}

function readLock() {
  if (!fs.existsSync(lockFile)) return null;
  return JSON.parse(fs.readFileSync(lockFile));
}

function writeLock(data) {
  fs.writeFileSync(lockFile, JSON.stringify(data));
}

function acquireLock() {
  const deviceId = getDeviceId();
  const existing = readLock();

  if (existing) {
    const isStale = now() - existing.heartbeat > TIMEOUT;

    if (existing.hostId !== deviceId && !isStale) {
      return {
        success: false,
        reason: "Another host is currently active."
      };
    }
  }

  writeLock({
    hostId: deviceId,
    heartbeat: now(),
    status: "ACTIVE"
  });

  return { success: true };
}

function updateHeartbeat() {
  const existing = readLock();
  if (!existing) return;

  existing.heartbeat = now();
  writeLock(existing);
}

function releaseLock() {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
}

module.exports = {
  acquireLock,
  updateHeartbeat,
  releaseLock
};