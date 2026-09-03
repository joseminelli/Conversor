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
            <input
              id="youtube-url"
              v-model="videoUrl"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              class="url-input"
              @keyup.enter="validateAndFetch"
            />
            <button @click="validateAndFetch" class="btn btn-primary">
              <i class="fa-solid fa-magnifying-glass"></i> Buscar
            </button>
          </div>
          <small class="hint">Suporta: youtube.com, youtu.be, youtube-nocookie.com</small>
        </div>
      </div>

      <div class="loading" v-if="isLoading">
        <div class="spinner"></div>
        <p>Processando URL...</p>
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
              <button
                @click="downloadType = 'video'"
                :class="['option-btn', { active: downloadType === 'video' }]"
              >
                <i class="fa-solid fa-film"></i> Vídeo
              </button>
              <button
                @click="downloadType = 'audio'"
                :class="['option-btn', { active: downloadType === 'audio' }]"
              >
                <i class="fa-solid fa-music"></i> Áudio
              </button>
            </div>
          </div>

          <div class="format-options" v-if="downloadType === 'video'">
            <label>Qualidade do vídeo:</label>
            <div class="quality-grid">
              <button
                v-for="quality in videoQualities"
                :key="quality.value"
                @click="selectedQuality = quality.value"
                :class="['quality-btn', { active: selectedQuality === quality.value }]"
              >
                <span class="label">{{ quality.label }}</span>
                <span class="size">{{ quality.size }}</span>
              </button>
            </div>
          </div>

          <div class="format-options" v-if="downloadType === 'audio'">
            <label>Formato de áudio:</label>
            <div class="format-buttons">
              <button
                v-for="format in audioFormats"
                :key="format"
                @click="selectedAudioFormat = format"
                :class="['format-btn', { active: selectedAudioFormat === format }]"
              >
                {{ format.toUpperCase() }}
              </button>
            </div>
          </div>

          <button @click="download" class="btn btn-success btn-large">
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
      error: '',
      downloadType: 'video' as 'video' | 'audio',
      selectedQuality: 'best',
      selectedAudioFormat: 'mp3',
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
      } catch (err) {
        this.error = `Erro ao conectar com servidor: ${err.message}`
      } finally {
        this.isLoading = false
      }
    },
    async download() {
      if (!this.videoInfo) {
        this.error = 'Nenhum vídeo carregado'
        return
      }

      this.$message.loading({
        content: 'Processando download...',
        duration: 0
      })

      try {
        const response = await fetch(API_CONFIG.endpoints.youtube.download, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: this.videoUrl,
            format_type: this.downloadType,
            quality: this.downloadType === 'video' ? this.selectedQuality : this.selectedAudioFormat
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          this.$message.error(errorData.detail || 'Erro ao processar download')
          return
        }

        const data = await response.json()

        // Abrir o link de download em nova aba
        if (data.url) {
          window.open(data.url, '_blank')
        }

        this.$message.success(
          `Download iniciado! (${this.downloadType === 'video' ? 'Vídeo' : 'Áudio'})`
        )
      } catch (err) {
        this.$message.error(`Erro: ${err.message}`)
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
  margin-bottom: 30px;
  text-align: center;
}

.tool-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.tool-header p {
  font-size: 14px;
  color: var(--text-secondary);
}

.tool-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.url-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.url-input-group label {
  font-weight: 500;
  color: var(--text-primary);
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.url-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  display: flex;
  gap: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.thumbnail {
  flex-shrink: 0;
  width: 160px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-tertiary);
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
  gap: 8px;
}

.details h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.channel,
.duration {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.download-options {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-group,
.format-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-group h4,
.format-options label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.option-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.option-btn,
.quality-btn,
.format-btn {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.option-btn:hover,
.quality-btn:hover,
.format-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.option-btn.active,
.quality-btn.active,
.format-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.quality-btn {
  flex-direction: column;
  gap: 4px;
}

.quality-btn .label {
  font-weight: 600;
  font-size: 13px;
}

.quality-btn .size {
  font-size: 11px;
  opacity: 0.7;
}

.format-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}

.btn-large {
  width: 100%;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
}

.btn-success {
  background: var(--success-color, #10b981);
  color: white;
  border: none;
}

.btn-success:hover {
  opacity: 0.9;
}

.error {
  background: var(--error-bg, #fee2e2);
  border: 1px solid var(--error-border, #fca5a5);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--error-text, #7f1d1d);
}

.error i {
  font-size: 20px;
  flex-shrink: 0;
}

.error p {
  margin: 0;
  flex: 1;
}

.info-box {
  background: var(--info-bg, #dbeafe);
  border: 1px solid var(--info-border, #93c5fd);
  border-radius: 12px;
  padding: 20px;
  color: var(--info-text, #1e3a8a);
}

.info-box i {
  margin-right: 8px;
}

.info-box h4 {
  margin: 12px 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.info-box ol {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
}

.info-box li {
  margin: 6px 0;
}
</style>
