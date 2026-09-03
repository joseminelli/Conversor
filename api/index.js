const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const axios = require('axios');

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

    console.log('Fetching info for:', url);
    const cmd = `python -m yt_dlp -j --extractor-args youtube:player_client=web "${url}"`;
    console.log('Running command:', cmd);

    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    console.log('Output received, parsing...');

    const info = JSON.parse(output);

    res.json({
      title: info.title,
      channel: info.uploader,
      thumbnail: info.thumbnail,
      duration: String(Math.floor(info.duration / 60)) + ':' + String(info.duration % 60).padStart(2, '0')
    });
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/youtube/audio-tracks', (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const cmd = `python -m yt_dlp -j --extractor-args youtube:player_client=web "${url}"`;
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

async function getInstagramData(url) {
  try {
    const response = await axios.get(url + '?__a=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data.graphql?.shortcode_media || response.data.items?.[0];
    if (!data) throw new Error('Could not extract data');

    return {
      id: data.id,
      caption: data.caption?.text || data.caption || '',
      username: data.owner?.username || data.user?.username || 'unknown',
      thumbnail: data.display_url || data.image_versions2?.candidates?.[0]?.url || '',
      mediaUrl: data.video_url || data.media_product_type === 'VIDEO' ? data.video_versions?.[0]?.url : data.display_url,
      isVideo: data.is_video || data.media_type === 2
    };
  } catch (error) {
    throw new Error(`Failed to fetch Instagram data: ${error.message}`);
  }
}

app.post('/instagram/info', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const data = await getInstagramData(url);

    res.json({
      title: data.caption || 'Post do Instagram',
      author: data.username,
      thumbnail: data.thumbnail,
      media_type: data.isVideo ? 'video' : 'photo'
    });
  } catch (error) {
    console.error('Instagram info error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/instagram/download', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const data = await getInstagramData(url);
    if (!data.mediaUrl) return res.status(400).json({ error: 'No media found' });

    const response = await axios.get(data.mediaUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    res.set('Content-Type', response.headers['content-type']);
    res.set('Content-Disposition', `attachment; filename="instagram.${data.isVideo ? 'mp4' : 'jpg'}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Instagram download error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
