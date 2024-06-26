const express = require("express");
const { body, validationResult } = require("express-validator");
const { isURL } = require("validator");
const cors = require("cors");
const { pipeline } = require("stream");
const ytdl = require("ytdl-core");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function getFullYoutubeUrl(url) {
  if (url.includes("youtu.be")) {
    const startIndex = url.lastIndexOf("/") + 1;
    const endIndex = url.indexOf("?") !== -1 ? url.indexOf("?") : url.length;
    const videoId = url.substring(startIndex, endIndex);
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

function downloadVideo(url, resolution) {
  const fullUrl = getFullYoutubeUrl(url);
  return new Promise((resolve, reject) => {
    const video = ytdl(fullUrl, {
      filter: (format) =>
        format.container === "mp4" && format.qualityLabel === resolution,
    });
    video.on("info", (info, format) => {
      video.pipe(resolution);
    });
    video.on("error", (error) => {
      reject(error);
    });
    video.on("end", () => {
      resolve();
    });
  });
}

function getVideoInfo(url) {
  const fullUrl = getFullYoutubeUrl(url);
  return ytdl.getBasicInfo(fullUrl);
}

function isValidYoutubeUrl(url) {
  return (
    isURL(url) && (url.includes("youtube.com") || url.includes("youtu.be"))
  );
}

app.post("/download/:resolution", body("url").isURL(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Invalid URL provided." });
  }

  const { url } = req.body;
  const { resolution } = req.params;

  if (!isValidYoutubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL provided." });
  }

  try {
    await downloadVideo(url, resolution);
    return res.status(200).json({
      message: `Video with resolution ${resolution} downloaded successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/video", body("url").isURL(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Invalid URL provided." });
  }

  const { url } = req.body;

  if (!isValidYoutubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL provided." });
  }

  try {
    const videoInfo = await getVideoInfo(url);
    return res.status(200).json(videoInfo);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
