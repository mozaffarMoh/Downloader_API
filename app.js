const express = require("express");
const { body, validationResult } = require("express-validator");
const { isURL } = require("validator");
const cors = require("cors");
const { pipeline } = require("stream");
const fbDownloader = require("fb-video-downloader"); // Import fb-video-downloader package
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function downloadVideo(url, resolution, destination) {
  return new Promise((resolve, reject) => {
    fbDownloader(url, { hd: resolution === 'hd' }) // Pass resolution options to the downloader
      .then((info) => {
        pipeline(info.stream, destination, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function isValidFacebookUrl(url) {
  return isURL(url) && url.includes("facebook.com");
}

app.post("/download/:resolution", body("url").isURL(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Invalid URL provided." });
  }

  const { url } = req.body;
  const { resolution } = req.params;

  if (!isValidFacebookUrl(url)) {
    return res.status(400).json({ error: "Invalid Facebook URL provided." });
  }

  try {
    await downloadVideo(url, resolution, res);
    return res.status(200).json({
      message: `Video downloaded successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
