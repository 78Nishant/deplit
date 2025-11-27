// import fs from 'fs';
// import path from 'path';


// export const getAllFiles =(folderPath:string)=>{
//     let results:string[]=[];

//     const files=fs.readdirSync(folderPath);
//     files.forEach(file => {
//        const fullFilePath=path.join(folderPath,file);
//        if(fs.statSync(fullFilePath).isDirectory()){
//         results=results.concat(getAllFiles(fullFilePath));
//        }
//        else{
//         results.push(fullFilePath);
//        } 
//     });

//     return results;
// }

// uploadAllFiles.ts
// import fs from "fs";
// import path from "path";
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { s3Client } from "./s3client.js";
// import dotenv from "dotenv";

// dotenv.config();

// const bucketName = process.env.AWS_BUCKET_NAME!;
// if (!bucketName) {
//   throw new Error("AWS_BUCKET_NAME not set in environment variables");
// }

// /**
//  * Recursively uploads all files in a folder (and its subfolders) to S3
//  */
// export const getAllFiles = async (folderPath: string) => {
//   const files = fs.readdirSync(folderPath);

//   for (const file of files) {
//     const fullFilePath = path.join(folderPath, file);

//     if (fs.statSync(fullFilePath).isDirectory()) {
//       // Recursive call for subfolders
//       await getAllFiles(fullFilePath);
//     } else {
//       const fileContent = fs.readFileSync(fullFilePath);
//       const relativeKey = path.relative(process.cwd(), fullFilePath).replace(/\\/g, "/");

//       const command = new PutObjectCommand({
//         Bucket: bucketName,
//         Key: relativeKey,
//         Body: fileContent,
//       });

//       try {
//         await s3Client.send(command);
//         console.log(` Uploaded: ${relativeKey}`);
//       } catch (err) {
//         console.error(` Failed to upload ${relativeKey}:`, err);
//       }
//     }
//   }
// };

// Example usage (you can also import this elsewhere)
// (async () => {
//   const folderToUpload = "dist"; // change to your folder path
//   console.log(`📂 Uploading all files from "${folderToUpload}" to S3...`);
//   await uploadAllFiles(folderToUpload);
//   console.log("🎉 All files uploaded successfully!");
// })();


//Upload only build folder to my s3 bucket

// src/files.ts
// src/files.ts
// import fs from "fs";
// import path from "path";
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { s3Client } from "./s3client.js";
// import dotenv from "dotenv";
// import mime from "mime-types";

// dotenv.config();

// const bucketName = process.env.AWS_BUCKET_NAME!;
// if (!bucketName) {
//   throw new Error("AWS_BUCKET_NAME not set in environment variables");
// }

/**
 * rootDir: the build folder (e.g. /.../output/SgFkX/build)
 * currentDir: used for recursion, start as rootDir
 * s3Prefix: optional prefix (like deployment id)
 */
// src/files.ts
// src/files.ts
// src/files.ts
// src/files.ts
import fs from "fs";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3client.js";
import dotenv from "dotenv";
import mime from "mime-types";

dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME!;
if (!bucketName) {
  throw new Error("❌ AWS_BUCKET_NAME not set in environment variables");
}

/**
 * Upload all files from a build folder to S3, preserving folder structure.
 *
 * rootDir   = absolute path to build folder (e.g. .../dist/output/IpXIq/build)
 * s3Prefix  = deployment id in S3 (e.g. "IpXIq")
 *
 * Examples of resulting keys:
 *   rootDir/index.html          → IpXIq/index.html
 *   rootDir/static/js/main.js   → IpXIq/static/js/main.js
 */
export const uploadAllFiles = async (
  rootDir: string,
  s3Prefix = ""
): Promise<void> => {
  const walk = async (currentDir: string) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullFilePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullFilePath);
      } else {
        const fileContent = fs.readFileSync(fullFilePath);

        // path relative to ROOT build folder
        const relativePath = path
          .relative(rootDir, fullFilePath)
          .replace(/\\/g, "/");

        const keyWithoutPrefix =
          relativePath.length > 0
            ? relativePath
            : path.basename(fullFilePath);

        const key = s3Prefix
          ? `${s3Prefix}/${keyWithoutPrefix}`
          : keyWithoutPrefix;

        const contentType =
          (mime.lookup(fullFilePath) as string) || "application/octet-stream";

        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: contentType,
        });

        try {
          await s3Client.send(command);
          console.log(`✅ Uploaded: ${key} (${contentType})`);
        } catch (err) {
          console.error(`❌ Failed to upload ${key}:`, err);
        }
      }
    }
  };

  await walk(rootDir);
};
