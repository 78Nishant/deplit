export default function LogsViewer({ logs, status, url }) {
  const hasLogs = logs && logs.length > 0;

  return (
    <div className="mt-8 bg-black text-green-400 p-4 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-2 text-white">Deployment Logs</h2>

      <pre className="whitespace-pre-wrap text-sm h-80 overflow-y-auto">
        {hasLogs
          ? logs.join("\n")
          : "No logs yet. Trigger a deployment to see logs here."}
      </pre>

      {status === "running" && (
        <p className="mt-2 text-sm text-yellow-300">
          Deployment in progress... Please wait.
        </p>
      )}

      {status === "success" && url && (
        <div className="mt-4 p-4 bg-green-700 text-white rounded-lg">
          <p className="font-bold">Deployment Successful 🎉</p>
          <a href={url} target="_blank" rel="noreferrer" className="underline break-all">
            {url}
          </a>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-4 bg-red-700 text-white rounded-lg">
          <p className="font-bold">Deployment Failed ❌</p>
          <p className="text-sm mt-1">
            Check the logs above for error details.
          </p>
        </div>
      )}
    </div>
  );
}
