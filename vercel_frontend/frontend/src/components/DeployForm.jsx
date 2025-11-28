import { useState } from "react";

export default function DeployForm({ onDeploy, isDeploying }) {
  const [repoUrl, setRepoUrl] = useState("");

  const isDisabled = isDeploying || !repoUrl.trim();

  return (
    <div className="p-6 bg-white shadow-xl rounded-xl w-full max-w-xl mx-auto mt-6">
      <h1 className="text-3xl font-bold mb-4 text-center">Deplit</h1>

      <label className="block mb-2 text-sm font-medium text-gray-700">
        GitHub Repository URL
      </label>
      <input
        type="text"
        placeholder="https://github.com/username/repo.git"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        className="w-full p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-black"
        disabled={isDeploying}
      />

      <button
        onClick={() => onDeploy(repoUrl)}
        disabled={isDisabled}
        className={`w-full p-3 rounded-lg font-semibold transition ${
          isDisabled
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-black text-white hover:bg-gray-800"
        }`}
      >
        {isDeploying ? "Deploying..." : "Deploy"}
      </button>
    </div>
  );
}
