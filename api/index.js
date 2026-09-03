const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['https://joseminelli.github.io', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false
}));

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/test', (req, res) => {
  res.json({ test: 'ok' });
});

app.post('/youtube/info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    res.json({
      title: videoDetails.title,
      channel: videoDetails.author.name,
      thumbnail: videoDetails.thumbnail.thumbnails[videoDetails.thumbnail.thumbnails.length - 1].url,
      duration: videoDetails.lengthSeconds
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/youtube/audio-tracks', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const info = await ytdl.getInfo(url);
    const formats = info.formats;

    const audioFormats = formats
      .filter(f => f.mimeType && f.mimeType.includes('audio'))
      .map(f => ({
        format_id: f.itag,
        language: 'Portuguese (BR)',
        codec: f.mimeType.split(';')[0].replace('audio/', ''),
        bitrate: f.bitrate ? Math.round(f.bitrate / 1000) : 128,
        is_original: true
      }))
      .filter((item, index, self) => index === self.findIndex(t => t.format_id === item.format_id));

    res.json({
      audio_tracks: audioFormats.length > 0 ? audioFormats : [
        { format_id: '251', language: 'Portuguese (BR)', codec: 'opus', bitrate: 128, is_original: true }
      ]
    });
  } catch (error) {
    console.error('Error fetching audio tracks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/youtube/stream', (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    res.json({ message: 'stream' });
  } catch (error) {
    console.error('Error streaming:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
