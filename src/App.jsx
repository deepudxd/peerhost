import { useEffect, useState } from "react";

function App() {
  const [dockerStatus, setDockerStatus] = useState("Checking...");
  const [serverStatus, setServerStatus] = useState("Checking...");

  useEffect(() => {
    async function init() {
      const docker = await window.api.checkDocker();
      setDockerStatus(docker ? "Docker Running" : "Docker Not Running");

      const status = await window.api.getServerStatus();
      updateServerState(status);
    }

    init();
  }, []);

  const updateServerState = (status) => {
    if (status === "running") setServerStatus("Running");
    else if (status === "stopped") setServerStatus("Stopped");
    else if (status === "not_created") setServerStatus("Not Created");
    else setServerStatus("Unknown");
  };

  const start = async () => {
    await window.api.startServer();
    const status = await window.api.getServerStatus();
    updateServerState(status);
  };

  const stop = async () => {
    await window.api.stopServer();
    const status = await window.api.getServerStatus();
    updateServerState(status);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>PeerHost</h1>
      <h2>Docker: {dockerStatus}</h2>
      <h2>Server: {serverStatus}</h2>
      <button onClick={start}>Start Server</button>
      <button onClick={stop}>Stop Server</button>
    </div>
  );
}

export default App;