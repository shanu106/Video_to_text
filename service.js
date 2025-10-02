const ffmpeg = require("fluent-ffmpeg");

export function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .noVideo()
      .audioCodec("pcm_s16le") // WAV format
      .on("end", () => resolve(audioPath))
      .on("error", (err) => reject(err))
      .run();
  });
}