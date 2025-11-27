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
import cors from "cors";
import express, { type Request, type Response } from "express";
import simpleGit from "simple-git";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { exec } from "child_process";
import util from "util";

import { generate } from "./utils.js";
import { uploadAllFiles } from "./files.js";

dotenv.config();

const execAsync = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const SITE_BASE_URL = process.env.AWS_SITE_BASE_URL; // e.g. http://bucket.s3-website-ap-south-1.amazonaws.com

app.post("/deploy", async (req: Request, res: Response) => {
  try {
    const { repoUrl } = req.body as { repoUrl?: string };

    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    const id = generate(); // unique deployment id
    const git = (simpleGit as any)();

    // Clone repo into dist/output/<id> (after compilation)
    const projectPath = path.join(__dirname, "output", id);
    console.log("📥 Cloning repo:", repoUrl, "into", projectPath);

    await git.clone(repoUrl, projectPath);

    // Install dependencies
    console.log("📦 Installing dependencies...");
    await execAsync("npm install", { cwd: projectPath });

    // Run build
    console.log("🏗️  Running build...");
    await execAsync("npm run build", {
  cwd: projectPath,
  env: {
    ...process.env,
    PUBLIC_URL: `/${id}`, // 🔥 tell CRA that app lives under /<id>
  },
});
    // Find build directory (dist / build / out)
    const possibleDirs = ["dist", "build", "out"];
    let buildDir: string | null = null;

    for (const dir of possibleDirs) {
      const full = path.join(projectPath, dir);
      console.log("🔍 Checking build folder:", full);

      if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        buildDir = full;
        break;
      }
    }

    if (!buildDir) {
      return res.status(500).json({
        error: "Could not find build folder (dist/build/out)",
      });
    }

    console.log("📂 Build output found at:", buildDir);

    // Upload build folder to S3 under prefix <id>/
    console.log("☁️ Uploading build to S3 with prefix:", id);
    await uploadAllFiles(buildDir, id); // not just buildDir
 // no id prefix
 // important: pass only buildDir & id
// important: pass only buildDir & id


    if (!SITE_BASE_URL) {
      console.warn("AWS_SITE_BASE_URL is not set in .env");
      return res.json({
        id,
        message:
          "Deployment finished, but AWS_SITE_BASE_URL is not configured on the server",
      });
    }

    // Final URL: http://bucket.s3-website-region.amazonaws.com/<id>/index.html
    const url = `${SITE_BASE_URL}/${id}/index.html`;
    console.log("✅ Deployed at:", url);

    return res.json({
      id,
      url,
      message: "Deployment completed successfully",
    });
  } catch (err: any) {
    console.error("❌ Deployment error:", err);
    return res.status(500).json({
      error: "Deployment failed",
      details: err?.message || String(err),
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server is running on http://localhost:3000");
});
