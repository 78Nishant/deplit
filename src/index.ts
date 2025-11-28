// import cors from "cors"; 
// import express from 'express';
// import simpleGit from "simple-git";
// import { generate } from './utils.js';
// import path from 'path';
// import { fileURLToPath } from 'url'; // Import fileURLToPath
// import { getAllFiles } from './files.js';

// const __filename = fileURLToPath(import.meta.url); // Get the current file path
// const __dirname = path.dirname(__filename); // Get the directory name

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.post('/deploy', async (req, res) => {
//     const repoUrl = req.body.repoUrl;
//     if (!repoUrl) {
//         return res.status(400).send('Repository URL is required');
//     }
//     const id = generate(); // To generate unique ID for each deployment
//     const git = (simpleGit as any)();
//     await git.clone(repoUrl, path.join(__dirname, `output/${id}`)); //Use __dirname here
//     console.log(`Deploying repository: ${repoUrl}`);

//     const files = getAllFiles(path.join(__dirname, `output/${id}`));
//     console.log(files);
//     res.json({
//         id: id,
//         msg: 'Deployment initiated'
//     });
// });

// app.listen(3000, () => {
//     console.log('Server is running on http://localhost:3000');
// });



// src/index.ts
// src/index.ts
// import cors from "cors";
// import express, {type Request,type Response } from "express";
// import cookieParser from "cookie-parser";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";
// import simpleGit from "simple-git";
// import { exec } from "child_process";
// import util from "util";
// import fs from "fs";

// import { generate } from "./utils.js";
// import { uploadAllFiles } from "./files.js";

// dotenv.config();

// const app = express();
// const execAsync = util.promisify(exec);

// app.use(cors({ origin: "*", credentials: true }));
// app.use(express.json());
// app.use(cookieParser());

// // __dirname fix for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /* -------------------------------------------------------------------------- */
// /*                         IN-MEMORY DEPLOYMENT STORE                         */
// /* -------------------------------------------------------------------------- */
// type DeploymentStatus = "pending" | "running" | "success" | "error";

// type DeploymentInfo = {
//   id: string;
//   status: DeploymentStatus;
//   logs: string[];
//   url?: string;
//   error?: string;
// };

// const deployments = new Map<string, DeploymentInfo>();

// function addLog(id: string, message: string) {
//   const info = deployments.get(id);
//   if (!info) return;

//   const line = `[${new Date().toISOString()}] ${message}`;
//   info.logs.push(line);
//   console.log(line);
// }

// /* -------------------------------------------------------------------------- */
// /*                                 DEPLOY ROUTE                               */
// /* -------------------------------------------------------------------------- */

// app.post("/deploy", async (req: Request, res: Response) => {
//   try {
//     const { repoUrl } = req.body as { repoUrl?: string };
//     if (!repoUrl) {
//       return res.status(400).json({ error: "Repository URL is required" });
//     }

//     const id = generate();
//     const projectPath = path.join(__dirname, "output", id);
//     const git = (simpleGit as any)();

//     deployments.set(id, {
//       id,
//       status: "running",
//       logs: [],
//     });

//     addLog(id, `🚀 Starting deployment for repo: ${repoUrl}`);
//     addLog(id, `Cloning into: ${projectPath}`);

//     await git.clone(repoUrl, projectPath);
//     addLog(id, "📦 Running npm install...");
//     await execAsync("npm install", { cwd: projectPath });

//     addLog(id, "🏗️ Running build (npm run build) with PUBLIC_URL...");
//     await execAsync("npm run build", {
//       cwd: projectPath,
//       env: {
//         ...process.env,
//         PUBLIC_URL: `/${id}`, // important for CRA
//       },
//     });

//     addLog(id, "🔍 Searching for build folder...");

//     const possibleDirs = ["dist", "build", "out"];
//     let buildDir: string | null = null;

//     for (const dir of possibleDirs) {
//       const full = path.join(projectPath, dir);
//       addLog(id, `Checking: ${full}`);

//       if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
//         buildDir = full;
//         break;
//       }
//     }

//     if (!buildDir) {
//       addLog(id, "❌ ERROR: No build directory found.");
//       const info = deployments.get(id)!;
//       info.status = "error";
//       info.error = "No build directory found (dist/build/out)";
//       return res.status(500).json({ error: info.error, id });
//     }

//     addLog(id, `📂 Build directory found at: ${buildDir}`);

//     addLog(id, `☁️ Uploading build to S3 under prefix: ${id}`);
//     await uploadAllFiles(buildDir, id);

//     const SITE_BASE_URL = process.env.AWS_SITE_BASE_URL!;
//     const finalUrl = `${SITE_BASE_URL}/${id}/index.html`;

//     addLog(id, `🎉 Deployment finished! URL: ${finalUrl}`);

//     const info = deployments.get(id)!;
//     info.status = "success";
//     info.url = finalUrl;

//     return res.json({
//       id,
//       url: finalUrl,
//       status: "success",
//     });

//   } catch (err: any) {
//     console.error("❌ Deployment error:", err);

//     const id = req.body?.id;
//     if (id && deployments.has(id)) {
//       addLog(id, `❌ Deployment failed: ${err.message}`);
//       const info = deployments.get(id)!;
//       info.status = "error";
//       info.error = err.message;
//     }

//     return res.status(500).json({
//       error: "Deployment failed",
//       details: err?.message,
//     });
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                         GET DEPLOYMENT LOGS ROUTE                          */
// /* -------------------------------------------------------------------------- */

// app.get("/deploy/:id/logs", (req: Request, res: Response) => {
//   const { id } = req.params;

//   if (!deployments.has(id)) {
//     return res.status(404).json({ error: "Invalid deployment ID" });
//   }

//   const info = deployments.get(id)!;
//   return res.json(info);
// });

// /* -------------------------------------------------------------------------- */
// /*                                SERVER START                                */
// /* -------------------------------------------------------------------------- */

// app.listen(3000, () => {
//   console.log("🚀 Server started at http://localhost:3000");
// });


import cors from "cors";
import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import simpleGit from "simple-git";
import { exec } from "child_process";
import util from "util";
import fs from "fs";

import { generate } from "./utils.js";
import { uploadAllFiles } from "./files.js";

dotenv.config();

const app = express();
const execAsync = util.promisify(exec);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------------------------------- */
/*                         IN-MEMORY DEPLOYMENT STORE                         */
/* -------------------------------------------------------------------------- */
type DeploymentStatus = "pending" | "running" | "success" | "error";

type DeploymentInfo = {
  id: string;
  status: DeploymentStatus;
  logs: string[];
  url?: string;
  error?: string;
};

const deployments = new Map<string, DeploymentInfo>();

function addLog(id: string, message: string) {
  const info = deployments.get(id);
  if (!info) return;

  const line = `[${new Date().toISOString()}] ${message}`;
  info.logs.push(line);
  console.log(line);
}

/* -------------------------------------------------------------------------- */
/*                                 DEPLOY ROUTE                               */
/* -------------------------------------------------------------------------- */

app.post("/deploy", async (req: Request, res: Response) => {
  try {
    const { repoUrl } = req.body as { repoUrl?: string };
    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    const id = generate();
    const projectPath = path.join(__dirname, "output", id);
    const git = (simpleGit as any)();

    deployments.set(id, {
      id,
      status: "running",
      logs: [],
    });

    addLog(id, `Starting deployment for repo: ${repoUrl}`);
    addLog(id, `Cloning into: ${projectPath}`);

    await git.clone(repoUrl, projectPath);

    addLog(id, " Running npm install...");
    await execAsync("npm install", { cwd: projectPath });

    addLog(id, " Running build (npm run build) with PUBLIC_URL...");
    await execAsync("npm run build", {
      cwd: projectPath,
      env: {
        ...process.env,
        PUBLIC_URL: `/${id}`, // important for CRA when using subfolder
      },
    });

    addLog(id, " Searching for build folder...");

    const possibleDirs = ["dist", "build", "out"];
    let buildDir: string | null = null;

    for (const dir of possibleDirs) {
      const full = path.join(projectPath, dir);
      addLog(id, `Checking: ${full}`);

      if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        buildDir = full;
        break;
      }
    }

    if (!buildDir) {
      addLog(id, " ERROR: No build directory found (dist/build/out).");
      const info = deployments.get(id)!;
      info.status = "error";
      info.error = "No build directory found (dist/build/out)";
      return res.status(500).json({ error: info.error, id });
    }

    addLog(id, ` Build directory found at: ${buildDir}`);

    addLog(id, ` Uploading build to S3 under prefix: ${id}`);
    await uploadAllFiles(buildDir, id);

    const SITE_BASE_URL = process.env.AWS_SITE_BASE_URL;
    if (!SITE_BASE_URL) {
      const info = deployments.get(id)!;
      info.status = "error";
      info.error = "AWS_SITE_BASE_URL is missing in .env file";
      addLog(id, " ERROR: AWS_SITE_BASE_URL is missing in .env file");
      return res.status(500).json({
        error: "AWS_SITE_BASE_URL is missing in .env file",
        id,
      });
    }

    const finalUrl = `${SITE_BASE_URL}/${id}/index.html`;

    addLog(id, ` Deployment finished! URL: ${finalUrl}`);

    const info = deployments.get(id)!;
    info.status = "success";
    info.url = finalUrl;

    return res.json({
      id,
      url: finalUrl,
      status: "success",
    });
  } catch (err: any) {
    console.error(" Deployment error:", err);

    const body = req.body as { id?: string } | undefined;
    const id = body?.id;

    if (id && deployments.has(id)) {
      addLog(id, ` Deployment failed: ${err.message}`);
      const info = deployments.get(id)!;
      info.status = "error";
      info.error = err.message;
    }

    return res.status(500).json({
      error: "Deployment failed",
      details: err?.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                         GET DEPLOYMENT LOGS ROUTE                          */
/* -------------------------------------------------------------------------- */

app.get("/deploy/:id/logs", (req: Request, res: Response) => {
  const id = req.params.id;

  // Validate type first
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Deployment ID is required" });
  }

  if (!deployments.has(id)) {
    return res.status(404).json({ error: "Invalid deployment ID" });
  }

  const info = deployments.get(id)!;
  return res.json(info);
});


/* -------------------------------------------------------------------------- */
/*                                SERVER START                                */
/* -------------------------------------------------------------------------- */

app.listen(3000, () => {
  console.log(" Server started at http://localhost:3000");
});
