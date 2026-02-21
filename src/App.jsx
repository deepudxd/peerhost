import { useEffect, useState } from "react";
import { useRef } from "react";

function App() {
  const [dockerStatus, setDockerStatus] = useState("Checking...");
  const [serverState, setServerState] = useState("Checking...");
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);
  const getLogColor = (line) => {
    if (line.includes("ERROR")) return "#ff4d4f";
    if (line.includes("WARN")) return "#faad14";
    if (line.includes("joined the game")) return "#52c41a";
    if (line.includes("left the game")) return "#fa541c";
    return "#d4d4d4";
  };

  // Initialize Docker + Server Status
  useEffect(() => {
    async function init() {
      const docker = await window.api.checkDocker();
      setDockerStatus(docker ? "Docker Running" : "Docker Not Running");

      const status = await window.api.getServerStatus();
      updateServerState(status);
    }

    init();
  }, []);

  // Log listener (separate effect)
  useEffect(() => {
    const cleanup = window.api.onLog((data) => {
      const lines = data.split("\n").filter(Boolean);

      setLogs((prev) => {
        const updated = [...prev, ...lines];
        return updated.slice(-500);
      });
    });

    return () => {
      cleanup(); // remove listener
    };
  }, []);
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const updateServerState = (status) => {
  if (status === "running") setServerState("STARTING");
  else if (status === "stopped") setServerState("STOPPED");
  else if (status === "not_created") setServerState("NOT_CREATED");
  else setServerState("UNKNOWN");
};

  const start = async () => {
    setServerState("STARTING");

    const result = await window.api.startServer();

    if (!result.success) {
      setServerState("STOPPED");
      alert(result.reason);
      return;
    }

    window.api.startLogStream();
  };

  const stop = async () => {
    window.api.stopLogStream();
    await window.api.stopServer();
    const status = await window.api.getServerStatus();
    updateServerState(status);
  };

  const StatusBadge = ({ text, type }) => {
    const colorMap = {
      READY: "#16a34a",
      STARTING: "#facc15",
      STOPPED: "#64748b",
      STOPPING: "#f97316",
      CRASHED: "#dc2626",
      NOT_CREATED: "#334155",
      success: "#16a34a",
      error: "#dc2626",
    };

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: 20,
          background: colorMap[type] || "#334155",
          color: "white",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {text}
      </span>
    );
  };

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  };

  const buttonStyleDanger = {
    ...buttonStyle,
    background: "#dc2626",
  };
  return (
    <div
      style={{
        background: "#0f172a",
        minHeight: "100vh",
        padding: 30,
        color: "#e2e8f0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 20 }}>🚀 PeerHost</h1>

      {/* Status Card */}
      <div
        style={{
          background: "#1e293b",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          border: "1px solid #334155",
        }}
      >
        <h3>Server Status</h3>

        <p>
          Docker:{" "}
          <StatusBadge
            text={dockerStatus}
            type={dockerStatus.includes("Running") ? "success" : "error"}
          />
        </p>

        <p>
          Server: <StatusBadge text={serverState} type={serverState} />
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          background: "#1e293b",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          border: "1px solid #334155",
          display: "flex",
          gap: 10,
        }}
      >
        <button
          style={buttonStyle}
          onClick={start}
          disabled={serverState === "STARTING" || serverState === "READY"}
        >
          Start
        </button>

        <button
          style={buttonStyleDanger}
          onClick={stop}
          disabled={serverState === "STOPPED" || serverState === "NOT_CREATED"}
        >
          Stop
        </button>
      </div>

      {/* Console */}
      <div
        style={{
          background: "#0d1117",
          padding: 15,
          borderRadius: 12,
          border: "1px solid #30363d",
        }}
      >
        <h3 style={{ marginBottom: 10 }}>Live Console</h3>

        <div
          ref={logRef}
          style={{
            height: 350,
            overflowY: "auto",
            fontFamily: "Consolas, monospace",
            fontSize: 13,
          }}
        >
          {logs.map((line, index) => (
            <div key={index} style={{ color: getLogColor(line) }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
