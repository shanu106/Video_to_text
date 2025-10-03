import './auth_setup.js'; // MUST be first: ensures GOOGLE_APPLICATION_CREDENTIALS is set before Google libs load
import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { transcribeWithGemini } from './ai-support.js';
import { uploadToGCS } from './storage_gcs.js';
import { toASLGlossGemini } from './gemini_client.js';
import youtubedl from 'youtube-dl-exec';
import cors from 'cors';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;

const storage = multer.diskStorage({
    destination:function (req, file, cb){
        cb(null, "uploads");
    },
    filename: function(req, file, cb){
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname);
        cb(null, `${name}-${Date.now()}${ext}`);
    }
});
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

const upload = multer({storage});
app.get('/', (req, res) => {
    res.send(`Hello from Express on port ${PORT}`);
});

app.get('/yt',async (req, res)=>{
    console.log("yt api called ");
    const videoUrl = req.query.url;
     if (!videoUrl) {
    return res.status(400).send("Missing ?url= parameter");
}

const outputPath = path.join(__dirname, "downloads", "%(title)s.%(ext)s");
try {
    // call the packaged binary via the npm wrapper
   const fs = await import('fs');
    const cookiesPath = path.join(__dirname, 'cookies.txt');

    const ytdlOptions = {
      format: 'bv*+ba/b',
      mergeOutputFormat: 'mp4',
      output: outputPath,
      print: 'after_move:filepath'
    };

    if (fs.existsSync(cookiesPath)) {
      ytdlOptions.cookies = cookiesPath; // youtube-dl accepts a cookies file via --cookies
      console.log(`Using cookies from ${cookiesPath}`);
    } else {
      console.warn(`cookies.txt not found at ${cookiesPath}; proceeding without cookies`);
    }

    const stdout = await youtubedl(videoUrl, ytdlOptions);
    const pathOut = (typeof stdout === 'string' ? stdout.trim().split("\n").pop() : null) || extractFilePath(String(stdout || ''));
    if (!pathOut) {
      console.error("❌ Could not determine downloaded file path from youtube-dl output:", stdout);
      return res.status(500).send("Download succeeded but final filepath not found");
    }
    console.log("✅ Final downloaded file:", pathOut);

    const finalPath = pathOut;
    const ans = await transcript(finalPath);
    console.log(ans);
    console.log("transcription done");
    res.json({ response: ans });

} catch (error) {
    console.log("error in yt-dlp exec : ", error);
    res.status(500).send("Download failed");
}
})

app.post("/transcribe", upload.single('video'), async (req, res)=>{
    try {
      
        const videoPath = req.file.path;
       
       
        const response =await transcript(videoPath)
        res.json({response})
   // ye aaj 17 sep ko night me 2:10 pr working h 

} catch (error) {
        console.log("error : ", error);
        res.json({error});
    }
})

// app.post("/asl", async(req, res)=>{
// try {
//     const text = "Hey everyone, Ali Ansari, and you're watching Sheryans Coding School. Welcome back to another video in our DSA series. In this video, we are going to solve a question named Search in Rotated Sorted Array, which is based on binary search algorithm. And in this, we will see a new thing that year, bhai, my array is sorted. If it is not sorted, then we will apply binary search on some conditions, on some situations. It's going to be fun, guys. We're going to discuss the intuition, we're going to discuss the approach, we're going to write code, and we're going to discuss the algorithm. So, let's begin.\n\nSo you can see this is a LeetCode question. The number is 33, and the name is Search in Rotated Sorted Array. It's a medium-level question. And you have to write an algorithm with O(log n) runtime complexity. So, let's understand the question.\n\nThere is an integer array `nums` sorted in ascending order with distinct values. Prior to being passed to your function, `nums` is possibly rotated at an unknown pivot index `k` (1 <= k < nums.length) such that the resulting array is [nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]] (0-indexed). For example, [0,1,2,4,5,6,7] might be rotated at pivot index 3 and become [4,5,6,7,0,1,2].\n\nGiven the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or -1 if it is not in `nums`.\n\nYou must write an algorithm with O(log n) runtime complexity.\n\nLet's see the examples.\nExample 1:\nInput: nums = [4,5,6,7,0,1,2], target = 0\nOutput: 4\n\nExample 2:\nInput: nums = [4,5,6,7,0,1,2], target = 3\nOutput: -1\n\nExample 3:\nInput: nums = [1], target = 0\nOutput: -1\n\nSo you can see, the array is sorted, but it's rotated. And we need to find the target element in this rotated array. And the constraint is that we need to write an algorithm with O(log n) time complexity, which means we have to use binary search.\n\nSo, the basic idea of binary search is that it works on a sorted array. My array is sorted, but it's rotated at some point. For example, in this array, [4, 5, 6, 7, 0, 1, 2], the sorted array would be [0, 1, 2, 4, 5, 6, 7]. But here, it's rotated at pivot index 3, which means after index 2, the array restarts from index 0. So, we have two sorted arrays, which are [4, 5, 6, 7] and [0, 1, 2].\n\nNow, the problem is that we cannot directly apply binary search because the entire array is not sorted. But, we can still use binary search logic, but we need to decide which half of the array is sorted.\n\nLet's consider the array: `[4, 5, 6, 7, 0, 1, 2]` and target `0`.\nFirst, we initialize `first = 0` and `last = nums.length - 1 = 6`.\nCalculate the middle index: `mid = floor((0 + 6) / 2) = 3`.\nThe middle element is `nums[mid] = nums[3] = 7`.\nNow, we need to check if the left half or the right half is sorted.\nWe check `nums[first] <= nums[mid]`. Here, `nums[0] = 4` and `nums[3] = 7`. So, `4 <= 7` is true. This means the left half, from `first` to `mid`, which is `[4, 5, 6, 7]`, is sorted.\n\nNow, we check if our target element lies within this sorted left half. Our target is `0`.\nWe check if `target >= nums[first]` and `target <= nums[mid]`. Here, `0 >= 4` is false. So, the target is not in the left sorted half.\n\nSince the target is not in the left sorted half, it must be in the right half (which might not be sorted). So, we discard the left half and update `first = mid + 1 = 3 + 1 = 4`.\nNow, `first = 4`, `last = 6`.\nCalculate `mid = floor((4 + 6) / 2) = 5`.\nThe middle element is `nums[mid] = nums[5] = 1`.\nNow, check which half is sorted.\nCheck `nums[first] <= nums[mid]`. Here, `nums[4] = 0` and `nums[5] = 1`. So, `0 <= 1` is true. This means the left half, from `first` to `mid`, which is `[0, 1]`, is sorted.\n\nNow, check if the target lies within this sorted left half. Our target is `0`.\nWe check if `target >= nums[first]` and `target <= nums[mid]`. Here, `0 >= 0` is true and `0 <= 1` is true. So, the target is in the left sorted half.\nSince we found the target in the left sorted half, we discard the right half and update `last = mid = 5`.\nNow, `first = 4`, `last = 5`.\nCalculate `mid = floor((4 + 5) / 2) = 4`.\nThe middle element is `nums[mid] = nums[4] = 0`.\nWe check if `nums[mid] == target`. Here, `0 == 0` is true.\nSo, we found the target at index `mid`, which is `4`. We return `mid = 4`.\n\nLet's consider Example 2: `nums = [4,5,6,7,0,1,2], target = 3`.\n`first = 0`, `last = 6`.\n`mid = 3`, `nums[mid] = 7`.\nLeft half `[4, 5, 6, 7]` is sorted.\nCheck if target is in the left half: `3 >= 4` is false. Target is not in the left half.\nUpdate `first = mid + 1 = 4`.\n`first = 4`, `last = 6`.\n`mid = 5`, `nums[mid] = 1`.\nLeft half `[0, 1]` is sorted.\nCheck if target is in the left half: `3 >= 0` is true, `3 <= 1` is false. Target is not in the left half.\nUpdate `last = mid - 1 = 5 - 1 = 4`.\nNow, `first = 4`, `last = 4`.\nCalculate `mid = floor((4 + 4) / 2) = 4`.\nThe middle element is `nums[mid] = nums[4] = 0`.\nCheck if `nums[mid] == target`. Here, `0 == 3` is false.\nNow we check the sorted half. `nums[first] <= nums[mid]`. `nums[4] = 0` and `nums[4] = 0`. `0 <= 0` is true. The left half is `[0]`.\nCheck if target is in this left half: `3 >= 0` is true, `3 <= 0` is false. Target is not in the left half.\nUpdate `first = mid + 1 = 4 + 1 = 5`.\nNow, `first = 5`, `last = 4`.\nThe loop condition `first <= last` is false. So, we exit the loop.\nSince we haven't found the target, we return `-1`.\n\nThis approach works. We need to handle the comparison between `nums[first]`, `nums[mid]`, `nums[last]`, and `target` carefully.\n\nHere is the code implementing this logic:\n\n```javascript\nvar search = function(nums, target) {\n    let first = 0;\n    let last = nums.length - 1;\n\n    while (first <= last) {\n        let mid = Math.floor((first + last) / 2);\n\n        if (nums[mid] === target) {\n            return mid;\n        }\n\n        // Check if the left half is sorted\n        if (nums[first] <= nums[mid]) {\n            // Check if target lies within the sorted left half\n            if (target >= nums[first] && target < nums[mid]) {\n                last = mid - 1; // Search in the left half\n            } else {\n                first = mid + 1; // Search in the right half\n            }\n        } \n        // Otherwise, the right half must be sorted\n        else {\n            // Check if target lies within the sorted right half\n            if (target > nums[mid] && target <= nums[last]) {\n                first = mid + 1; // Search in the right half\n            } else {\n                last = mid - 1; // Search in the left half\n            }\n        }\n    }\n\n    return -1; // Target not found\n};\n```";
//      const result = await toASLGlossGemini(text);
//     console.log("done");
//     res.json({result});
// } catch (error) {
//     console.log("error : ", error);
//     res.json({error});
// }
   
// })


async function transcript(videoPath) {
    const originalName = videoPath.split("/").pop().split("-")[0];
    console.log("original name is :", originalName);
     const gcsUri = await uploadToGCS("video_to_text_bucket_samadhan_sistec",videoPath,originalName);
     console.log("gcs uri is : ", gcsUri);
    if(!gcsUri) {
        throw new Error("GCS upload failed");
    }
     const response = await transcribeWithGemini(process.env.GOOGLE_PROJECT_ID,process.env.GOOGLE_CLOUD_LOCATION,gcsUri)
    console.log("done");    
    return response;
}
function extractFilePath(logLine) {
  let match;

  // Case 1: "Deleting original file ..."
  match = logLine.match(/Deleting original file (.+?) \(pass/);
  if (match) return match[1].trim();

  // Case 2: "[download] ... has already been downloaded"
  match = logLine.match(/\[download\]\s+(.+?)\s+has already been downloaded/);
  if (match) return match[1].trim();

  return null; // no path found
}


app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
