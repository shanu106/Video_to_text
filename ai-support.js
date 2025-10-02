import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import os from "os";
import path from "path";
import {VertexAI} from '@google-cloud/vertexai';

// ensure a credentials file exists so VertexAI can use ADC
(function ensureCreds() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  const existing = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (existing && fs.existsSync(existing)) return;
  if (!raw) return;
  let obj = null;
  try {
    obj = JSON.parse(raw);
  } catch {
    try {
      obj = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      console.error('ai-support: failed to parse GOOGLE_SERVICE_ACCOUNT:', err);
      return;
    }
  }
  try {
    const out = path.join(os.tmpdir(), `gcloud_sa_${Date.now()}.json`);
    fs.writeFileSync(out, JSON.stringify(obj), { mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = out;
  } catch (err) {
    console.error('ai-support: failed to write temp service account file:', err);
  }
})();

export async function transcribeWithGemini(projectId, location, videoUri) {
  // construct VertexAI client without googleAuthOptions/keyFilename
  const vertexAI = new VertexAI({
    project: projectId,
    location: location
  });

  const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const contents = [{
      role:"user",
      parts:[
        {
          fileData:{fileUri:videoUri,
            mimeType:'video/mp4'
          }
        },
        {text: 'Transcribe the audo from this video'}
   ] } 
  ];

  const response = await model.generateContent({ contents });
  console.log("response is : ", response)
  const result = await response.response;
  return result.candidates[0].content.parts[0].text;
}