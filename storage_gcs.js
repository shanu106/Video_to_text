import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import os from "os";
import path from "path";
import {Storage} from "@google-cloud/storage";

// If a base64/raw JSON service account is provided in env, ensure a JSON key file exists
// and set GOOGLE_APPLICATION_CREDENTIALS so other Google libs can find it.
(function ensureServiceAccountFile() {
	const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
	const already = process.env.GOOGLE_APPLICATION_CREDENTIALS;
	if (!raw) return; // nothing to do
	// If GOOGLE_APPLICATION_CREDENTIALS already points to an existing file, keep it
	if (already && fs.existsSync(already)) return;

	let saObj = null;
	// try parse raw JSON
	try {
		saObj = JSON.parse(raw);
	} catch (e) {
		// try base64 decode then parse
		try {
			const decoded = Buffer.from(raw, "base64").toString("utf8");
			saObj = JSON.parse(decoded);
		} catch (err) {
			console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT from .env:", err);
			return;
		}
	}

	try {
		const outFile = path.join(os.tmpdir(), `gcloud_service_account_${Date.now()}.json`);
		fs.writeFileSync(outFile, JSON.stringify(saObj), { mode: 0o600 });
		process.env.GOOGLE_APPLICATION_CREDENTIALS = outFile;
		// optional: keep a reference so temp file isn't accidentally garbage-collected
		// (not strictly necessary; file stays on disk until removed)
	} catch (err) {
		console.error("Unable to write service account JSON to temp file:", err);
	}
})();

// build storage options from env: accept either a base64/raw JSON service account or a key file path
const storageOptions = { projectId: process.env.GOOGLE_PROJECT_ID };

const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT; // recommended: base64-encoded JSON or raw JSON string
if (rawCreds) {
	try {
		// try raw JSON first
		storageOptions.credentials = JSON.parse(rawCreds);
	} catch (e) {
		try {
			// fallback: base64-encoded JSON
			const decoded = Buffer.from(rawCreds, "base64").toString("utf8");
			storageOptions.credentials = JSON.parse(decoded);
		} catch (err) {
			console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT from .env:", err);
		}
	}
}

// fallback to keyFilename path if provided and no inline credentials parsed
if (!storageOptions.credentials && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
	storageOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const storage = new Storage(storageOptions);

export async function uploadToGCS(bucketName, filePath,destFileName) {

    try {
          await storage.bucket(bucketName).upload(filePath,{
        destination:destFileName,
        resumable:false
    });

    return `gs://${bucketName}/${destFileName}`;
    } catch (error) {
        console.log("error in gcs storage : ", error);
        return error;
    }
    
  
}