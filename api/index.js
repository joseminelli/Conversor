const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');

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

app.post('/youtube/info', (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const cmd = `python -m yt_dlp -j --no-warnings "${url}"`;
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const info = JSON.parse(output);

    res.json({
      title: info.title,
      channel: info.uploader,
      thumbnail: info.thumbnail,
      duration: String(Math.floor(info.duration / 60)) + ':' + String(info.duration % 60).padStart(2, '0')
    });
  } catch (error) {
    console.error('Error fetching video info:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/youtube/audio-tracks', (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const cmd = `python -m yt_dlp -j --no-warnings "${url}"`;
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const info = JSON.parse(output);
    const formats = info.formats || [];

    const audioFormats = formats
      .filter(f => f.vcodec === 'none' && f.acodec && f.acodec !== 'none')
      .map(f => ({
        format_id: f.format_id,
        language: f.language || 'Portuguese (BR)',
        codec: f.acodec,
        bitrate: f.abr || 128,
        is_original: true
      }))
      .filter((item, index, self) => index === self.findIndex(t => t.format_id === item.format_id));

    res.json({
      audio_tracks: audioFormats.length > 0 ? audioFormats : [
        { format_id: '251', language: 'Portuguese (BR)', codec: 'opus', bitrate: 128, is_original: true }
      ]
    });
  } catch (error) {
    console.error('Error fetching audio tracks:', error.message);
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
