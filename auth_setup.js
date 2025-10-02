import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import os from "os";
import path from "path";

(function ensureServiceAccountFile() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  const existingPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  // If no inline SA provided, nothing to do
  if (!raw) return;
  // If GOOGLE_APPLICATION_CREDENTIALS already points to an existing file, keep it
  if (existingPath && fs.existsSync(existingPath)) return;

  let saObj = null;
  try {
    saObj = JSON.parse(raw); // raw JSON in env
  } catch {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      saObj = JSON.parse(decoded); // base64 JSON in env
    } catch (err) {
      console.error("auth_setup: failed to parse GOOGLE_SERVICE_ACCOUNT:", err);
      return;
    }
  }

  try {
    const outFile = path.join(os.tmpdir(), `gcloud_service_account_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(saObj), { mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = outFile;
    // note: temp file remains on disk; delete manually if desired
  } catch (err) {
    console.error("auth_setup: unable to write service account JSON to temp file:", err);
  }
})();
