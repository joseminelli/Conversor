<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-brands fa-youtube"></i> Baixador de YouTube</h1>
      <p>Baixe vídeos e áudio do YouTube em diversos formatos</p>
    </div>

    <div class="tool-content">
      <div class="input-section">
        <div class="url-input-group">
          <label for="youtube-url">Cole a URL do YouTube:</label>
          <div class="input-wrapper">
            <input id="youtube-url" v-model="videoUrl" type="text" placeholder="https://www.youtube.com/watch?v=..."
              class="url-input" @keyup.enter="validateAndFetch" />
            <button @click="validateAndFetch" class="btn btn-search">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
          <small class="hint">Suporta: youtube.com, youtu.be, youtube-nocookie.com</small>
        </div>
      </div>

      <div class="loading-overlay" v-if="isLoading || isDownloading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>{{ isDownloading ? 'Baixando arquivo (isso pode levar alguns minutos)...' : 'Processando URL...' }}</p>
        </div>
      </div>

      <div class="video-info" v-if="videoInfo && !isLoading">
        <div class="info-card">
          <div class="thumbnail">
            <img :src="videoInfo.thumbnail" :alt="videoInfo.title" />
          </div>
          <div class="details">
            <h3>{{ videoInfo.title }}</h3>
            <p class="channel">
              <i class="fa-solid fa-user"></i> {{ videoInfo.channel }}
            </p>
            <p class="duration">
              <i class="fa-solid fa-clock"></i> {{ videoInfo.duration }}
            </p>
          </div>
        </div>

        <div class="download-options">
          <div class="option-group">
            <h4>Selecione o tipo de download:</h4>
            <div class="option-buttons">
              <button @click="downloadType = 'video'" :class="['option-btn', { active: downloadType === 'video' }]">
                <i class="fa-solid fa-film"></i> Vídeo
              </button>
              <button @click="downloadType = 'audio'" :class="['option-btn', { active: downloadType === 'audio' }]">
                <i class="fa-solid fa-music"></i> Áudio
              </button>
            </div>
          </div>

          <div class="format-options" v-if="downloadType === 'video'">
            <label>Qualidade do vídeo:</label>
            <div class="quality-grid">
              <button v-for="quality in videoQualities" :key="quality.value" @click="selectedQuality = quality.value"
                :class="['quality-btn', { active: selectedQuality === quality.value }]">
                <span class="label">{{ quality.label }}</span>
                <span class="size">{{ quality.size }}</span>
                <i v-if="selectedQuality === quality.value" class="fa-solid fa-check"></i>
              </button>
            </div>
          </div>

          <div class="format-options" v-if="downloadType === 'video' && audioTracks.length > 0">
            <label>Idioma do áudio:</label>
            <div class="audio-select">
              <select v-model="selectedAudioTrack" class="select-field">
                <option v-for="track in audioTracks" :key="track.format_id" :value="track.format_id">
                  {{ track.language }} {{ track.is_original ? '(Original)' : '' }} - {{ track.codec || 'N/A' }}
                </option>
              </select>
            </div>
          </div>

          <button @click="download" class="btn btn-success btn-large" :disabled="isDownloading">
            <i class="fa-solid fa-download"></i>
            {{
              downloadType === 'video'
                ? 'Baixar Vídeo'
                : 'Baixar Áudio'
            }}
          </button>
        </div>
      </div>

      <div class="error" v-if="error">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>{{ error }}</p>
        <button @click="clearError" class="btn btn-small">
          <i class="fa-solid fa-xmark"></i> Fechar
        </button>
      </div>

      <div class="info-box" v-if="!videoInfo && !isLoading && !error">
        <i class="fa-solid fa-circle-info"></i>
        <h4>Como usar:</h4>
        <ol>
          <li>Cole a URL de um vídeo do YouTube no campo acima</li>
          <li>Clique em "Buscar" para carregar informações do vídeo</li>
          <li>Escolha se deseja baixar o vídeo ou apenas o áudio</li>
          <li>Selecione a qualidade ou formato desejado</li>
          <li>Clique em "Baixar" para iniciar o download</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { API_CONFIG } from '@/config/api'

interface VideoInfo {
  title: string
  channel: string
  thumbnail: string
  duration: string
}

export default defineComponent({
  name: 'YouTubeDownloaderView',
  data() {
    return {
      videoUrl: '',
      videoInfo: null as VideoInfo | null,
      isLoading: false,
      isDownloading: false,
      error: '',
      downloadType: 'video' as 'video' | 'audio',
      selectedQuality: 'best',
      selectedAudioFormat: 'mp3',
      audioTracks: [] as any[],
      selectedAudioTrack: '',
      videoQualities: [
        { value: 'best', label: 'Melhor', size: 'Variável' },
        { value: '1080p', label: '1080p', size: '~100MB' },
        { value: '720p', label: '720p', size: '~50MB' },
        { value: '480p', label: '480p', size: '~25MB' },
        { value: '360p', label: '360p', size: '~15MB' }
      ],
      audioFormats: ['mp3', 'wav', 'aac', 'm4a']
    }
  },
  methods: {
    async validateAndFetch() {
      this.error = ''
      const url = this.videoUrl.trim()

      if (!url) {
        this.error = 'Por favor, cole uma URL válida'
        return
      }

      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?((youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s]+)$/
      if (!youtubeRegex.test(url)) {
        this.error =
          'URL não é válida. Use uma URL do YouTube (youtube.com, youtu.be, etc.)'
        return
      }

      await this.fetchVideoInfo()
    },
    async fetchVideoInfo() {
      this.isLoading = true
      try {
        const response = await fetch(API_CONFIG.endpoints.youtube.info, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: this.videoUrl,
            format_type: this.downloadType
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          this.error = errorData.detail || 'Erro ao buscar vídeo'
          this.isLoading = false
          return
        }

        const data = await response.json()
        this.videoInfo = {
          title: data.title,
          channel: data.channel,
          thumbnail: data.thumbnail,
          duration: data.duration
        }

        // Carregar áudios disponíveis
        await this.loadAudioTracks()
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        this.error = `Erro ao conectar com servidor: ${message}`
      } finally {
        this.isLoading = false
      }
    },
    async loadAudioTracks() {
      try {
        // Chamar endpoint de audio tracks
        const tracksResponse = await fetch(`${API_CONFIG.baseUrl}/api/youtube/audio-tracks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: this.videoUrl,
            format_type: 'audio'
          })
        })

        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json()
          const tracks = tracksData.audio_tracks || []

          // Já vem agrupado por idioma e ordenado por qualidade do backend
          this.audioTracks = tracks

          // Selecionar por padrão: original > português > melhor qualidade
          let defaultTrack: any = tracks[0]

          // Procurar áudio original
          const originalTrack = tracks.find((t: any) => t.is_original)
          if (originalTrack) {
            defaultTrack = originalTrack
          } else {
            // Se não encontrou original, usar português se disponível
            const ptTrack = tracks.find((t: any) => t.language.includes('pt'))
            if (ptTrack) {
              defaultTrack = ptTrack
            }
          }

          this.selectedAudioTrack = defaultTrack.format_id
        }
      } catch (err) {
        console.error('Erro ao carregar áudios:', err)
      }
    },
    async download() {
      if (!this.videoInfo) {
        this.error = 'Nenhum vídeo carregado'
        return
      }

      this.isDownloading = true

      try {
        const response = await fetch(API_CONFIG.endpoints.youtube.stream, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: this.videoUrl,
            format_type: this.downloadType,
            quality: this.downloadType === 'video' ? this.selectedQuality : this.selectedAudioFormat,
            audio_track_id: this.selectedAudioTrack || null
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          this.error = errorData.detail || 'Erro ao processar download'
          return
        }

        // Gerar download do arquivo
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Extrair nome do arquivo do header Content-Disposition se disponível
        const contentDisposition = response.headers.get('content-disposition')
        let filename = `download.${this.downloadType === 'audio' ? 'mp3' : 'mp4'}`
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        this.$message?.success(
          `Download concluído! (${this.downloadType === 'video' ? 'Vídeo' : 'Áudio'})`
        )
      } catch (err) {
        this.error = `Erro: ${err instanceof Error ? err.message : String(err)}`
      } finally {
        this.isDownloading = false
      }
    },
    clearError() {
      this.error = ''
    }
  }
})
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.tool-header {
  margin-bottom: 40px;
  text-align: center;
}

.tool-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8ab4f8, #c58af9, #f48aab);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.tool-header h1 i {
  font-size: 2.8rem;
  background: linear-gradient(135deg, #8ab4f8, #c58af9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tool-header p {
  font-size: 1.1rem;
  color: var(--text-color);
  opacity: 0.7;
  margin: 0;
  font-weight: 300;
}

.tool-content {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.input-section {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 30px;
  backdrop-filter: blur(10px);
}

.url-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.url-input-group label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.url-input {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 10px;
  font-size: 0.95rem;
  background: var(--input-bg);
  color: var(--text-color);
  transition: all 0.3s;
  font-family: var(--font-family);
}

.url-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 20px rgba(138, 180, 248, 0.2);
}

.hint {
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.6;
  margin-left: 2px;
}

.btn-search {
  padding: 14px 24px;
  background: linear-gradient(135deg, #8ab4f8, #c58af9);
  color: white;
  border: none;
  max-width: fit-content;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(138, 180, 248, 0.2);
  font-family: var(--font-family);
}

.btn-search:hover {
  box-shadow: 0 12px 30px rgba(138, 180, 248, 0.3);
  transform: translateY(-2px);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: #1c1c1e;
  border-radius: 20px;
  padding: 48px;
  border: 1px solid rgba(138, 180, 248, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  max-width: 400px;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-content p {
  font-size: 1rem;
  color: var(--text-color);
  margin: 0;
  text-align: center;
  line-height: 1.6;
}

.spinner {
  width: 56px;
  height: 56px;
  border: 4px solid rgba(138, 180, 248, 0.2);
  border-top-color: #8ab4f8;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.info-card {
  display: flex;
  gap: 20px;
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.info-card:hover {
  border-color: rgba(138, 180, 248, 0.3);
  box-shadow: 0 8px 25px rgba(138, 180, 248, 0.1);
}

.thumbnail {
  flex-shrink: 0;
  width: 200px;
  height: 112px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(138, 180, 248, 0.1);
  border: 1px solid rgba(138, 180, 248, 0.2);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.details h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.4;
}

.channel,
.duration {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-color);
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 8px;
}

.download-options {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  backdrop-filter: blur(10px);
}

.option-group,
.format-options {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.option-group h4,
.format-options label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.option-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.option-btn,
.quality-btn,
.format-btn {
  padding: 14px 16px;
  border: 2px solid rgba(138, 180, 248, 0.3);
  background: rgba(138, 180, 248, 0.05);
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-family);
}

.option-btn:hover,
.quality-btn:hover,
.format-btn:hover {
  border-color: var(--accent-color);
  background: rgba(138, 180, 248, 0.1);
  transform: translateY(-2px);
  color: #fff;
}

.option-btn.active,
.quality-btn.active,
.format-btn.active {
  background: linear-gradient(135deg, #8ab4f8, #c58af9);
  border-color: var(--accent-color);
  color: white;
  box-shadow: 0 8px 20px rgba(138, 180, 248, 0.2);
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0px, 1fr));
  gap: 12px;
}

.quality-btn {
  flex-direction: column;
  gap: 6px;
  position: relative;
  height: auto;
  height: fit-content;
}

.quality-btn .label {
  font-weight: 700;
  font-size: 0.95rem;
}

.quality-btn .size {
  font-size: 0.85rem;
  opacity: 0.8;
}

.quality-btn i {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 16px;
  color: white;
}

.format-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 12px;
}

.audio-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-field {
  padding: 12px 16px;
  border: 1px solid rgba(138, 180, 248, 0.3);
  border-radius: 10px;
  background: rgba(138, 180, 248, 0.05);
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  appearance: none;
  font-family: var(--font-family);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238ab4f8' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 38px;
}

.select-field:hover {
  border-color: var(--accent-color);
  background: rgba(138, 180, 248, 0.08);
}

.select-field:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 20px rgba(138, 180, 248, 0.2);
}

.btn-large {
  width: 100%;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  font-family: var(--font-family);
}

.btn-success {
  background: var(--success-color);
  color: white;
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 20px rgba(74, 222, 128, 0.2);
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(74, 222, 128, 0.3);
}

.btn-success:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--error-color);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error i {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.error p {
  margin: 0;
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.5;
}

.info-box {
  background: rgba(138, 180, 248, 0.1);
  border: 1px solid rgba(138, 180, 248, 0.3);
  border-radius: 12px;
  padding: 24px;
  color: var(--text-color);
}

.info-box i {
  margin-right: 8px;
  font-size: 18px;
  color: var(--accent-color);
}

.info-box h4 {
  margin: 12px 0 12px 0;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.info-box ol {
  margin: 0;
  padding-left: 20px;
  font-size: 0.95rem;
}

.info-box li {
  margin: 8px 0;
  line-height: 1.6;
  opacity: 0.8;
}

/* Responsividade */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }

  .url-input {
    width: stretch;
  }

  .btn-search {
    max-width: none;
  }

  .tool-header h1 {
    font-size: 2rem;
  }

  .tool-header p {
    font-size: 1rem;
  }

  .input-section {
    padding: 20px;
  }

  .info-card {
    flex-direction: column;
  }

  .thumbnail {
    width: 100%;
    height: 180px;
  }

  .input-wrapper {
    flex-direction: column;
  }

  .btn-search {
    width: 100%;
    height: auto;
  }

  .option-buttons {
    grid-template-columns: 1fr;
  }

  .quality-grid {
    grid-template-columns: 1fr;
  }

  .loading-content {
    padding: 36px 24px;
  }

  .download-options {
    padding: 20px;
  }
}
</style>
