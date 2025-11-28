import { useEffect, useRef, useState } from "react";
import DeployForm from "./components/DeployForm";
import LogsViewer from "./components/LogsViewer";

const API_BASE_URL = "http://localhost:3000";

export default function App() {
  const [deploymentId, setDeploymentId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null); // "pending" | "running" | "success" | "error" | null
  const [finalUrl, setFinalUrl] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const pollIntervalRef = useRef(null);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  async function startPolling(id) {
    // clear any previous polling
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/deploy/${id}/logs`);
        if (!res.ok) {
          // if logs not yet available or error, just skip this tick
          return;
        }

        const data = await res.json();
        setLogs(data.logs || []);
        setStatus(data.status || null);
        setFinalUrl(data.url || null);

        if (data.status === "success" || data.status === "error") {
          if (pollIntervalRef.current !== null) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsDeploying(false);
        }
      } catch (err) {
        console.error("Error while polling logs:", err);
      }
    }, 1000);
  }

  async function handleDeploy(repoUrl) {
    if (!repoUrl.trim()) return;
    if (isDeploying) return; // prevent double-click / multiple parallel deploys

    setIsDeploying(true);
    setDeploymentId(null);
    setFinalUrl(null);
    setStatus("running");

    // show immediate feedback in logs
    setLogs([
      `[${new Date().toISOString()}] 🚀 Deployment triggered...`,
      `[${new Date().toISOString()}] Waiting for server response...`,
    ]);

    try {
      const res = await fetch(`${API_BASE_URL}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setLogs((prev) => [
          ...prev,
          `[${new Date().toISOString()}] ❌ Deployment failed to start: ${
            data.error || "Unknown error"
          }`,
        ]);
        setIsDeploying(false);
        return;
      }

      setDeploymentId(data.id);
      setLogs((prev) => [
        ...prev,
        `[${new Date().toISOString()}] ✅ Deployment started with ID: ${data.id}`,
      ]);

      // start polling logs from backend
      await startPolling(data.id);
    } catch (err) {
      console.error("Deploy error:", err);
      setStatus("error");
      setLogs((prev) => [
        ...prev,
        `[${new Date().toISOString()}] ❌ Deployment request failed: ${
          err.message || String(err)
        }`,
      ]);
      setIsDeploying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      <DeployForm onDeploy={handleDeploy} isDeploying={isDeploying} />

      {/* Always show logs viewer so user sees messages even before id exists */}
      <LogsViewer logs={logs} status={status} url={finalUrl} />
    </div>
  );
}
