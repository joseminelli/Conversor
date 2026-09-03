<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-brands fa-tiktok"></i> Baixador de TikTok</h1>
      <p>Baixe vídeos do TikTok sem marca d'água</p>
    </div>

    <div class="tool-content">
      <div class="input-section">
        <div class="url-input-group">
          <label for="tiktok-url">Cole a URL do TikTok:</label>
          <div class="input-wrapper">
            <input
              id="tiktok-url"
              v-model="videoUrl"
              type="text"
              placeholder="https://www.tiktok.com/@usuario/video/123456789"
              class="url-input"
              @keyup.enter="validateAndFetch"
            />
            <button @click="validateAndFetch" class="btn btn-primary">
              <i class="fa-solid fa-magnifying-glass"></i> Buscar
            </button>
          </div>
          <small class="hint">Suporta: Vídeos e Lives do TikTok</small>
        </div>
      </div>

      <div class="loading" v-if="isLoading">
        <div class="spinner"></div>
        <p>Processando URL...</p>
      </div>

      <div class="video-info" v-if="videoData && !isLoading">
        <div class="video-card">
          <div class="video-preview">
            <video :src="videoData.videoUrl" controls></video>
          </div>
          <div class="video-details">
            <div class="creator-info">
              <img :src="videoData.creatorAvatar" :alt="videoData.creator" class="avatar" />
              <div>
                <h4>{{ videoData.creator }}</h4>
                <p class="handle">@{{ videoData.handle }}</p>
              </div>
            </div>
            <p class="description">{{ videoData.description }}</p>
            <div class="stats">
              <span><i class="fa-solid fa-heart"></i> {{ videoData.likes }}</span>
              <span><i class="fa-solid fa-comment"></i> {{ videoData.comments }}</span>
              <span><i class="fa-solid fa-share"></i> {{ videoData.shares }}</span>
            </div>
          </div>
        </div>

        <div class="download-options">
          <div class="option-group">
            <h4>Opções de Download:</h4>
            <div class="option-buttons">
              <button
                @click="downloadType = 'video'"
                :class="['option-btn', { active: downloadType === 'video' }]"
              >
                <i class="fa-solid fa-film"></i> Vídeo (sem marca)
              </button>
              <button
                @click="downloadType = 'audio'"
                :class="['option-btn', { active: downloadType === 'audio' }]"
              >
                <i class="fa-solid fa-music"></i> Apenas Áudio
              </button>
            </div>
          </div>

          <div class="quality-options" v-if="downloadType === 'video'">
            <label>Qualidade:</label>
            <div class="quality-buttons">
              <button
                v-for="quality in ['high', 'medium', 'low']"
                :key="quality"
                @click="selectedQuality = quality"
                :class="['quality-btn', { active: selectedQuality === quality }]"
              >
                {{ quality.charAt(0).toUpperCase() + quality.slice(1) }}
              </button>
            </div>
          </div>

          <div class="extra-options">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="removeWatermark"
              />
              <span>Remover marca d'água do TikTok</span>
            </label>
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

      <div class="info-box" v-if="!videoData && !isLoading && !error">
        <i class="fa-solid fa-circle-info"></i>
        <h4>Como usar:</h4>
        <ol>
          <li>Abra um vídeo do TikTok que deseja baixar</li>
          <li>Clique nos 3 pontinhos e selecione "Copiar link"</li>
          <li>Cole a URL no campo acima</li>
          <li>Clique em "Buscar" para carregar o vídeo</li>
          <li>Escolha se quer o vídeo completo ou apenas o áudio</li>
          <li>Clique em "Baixar" para salvar em seu dispositivo</li>
        </ol>
        <p class="note">⚠️ Use apenas para conteúdo que você tem direito a usar</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

interface VideoData {
  videoUrl: string
  description: string
  creator: string
  handle: string
  creatorAvatar: string
  likes: string
  comments: string
  shares: string
}

export default defineComponent({
  name: 'TikTokDownloaderView',
  data() {
    return {
      videoUrl: '',
      videoData: null as VideoData | null,
      isLoading: false,
      error: '',
      downloadType: 'video' as 'video' | 'audio',
      selectedQuality: 'high',
      removeWatermark: true
    }
  },
  methods: {
    validateAndFetch() {
      this.error = ''
      const url = this.videoUrl.trim()

      if (!url) {
        this.error = 'Por favor, cole uma URL válida'
        return
      }

      const tiktokRegex =
        /^(https?:\/\/)?(www\.)?(m\.)?tiktok\.com\/.*\/(video|photo)\/\d+/
      if (!tiktokRegex.test(url)) {
        this.error = 'URL não é válida. Use uma URL direta de um vídeo do TikTok'
        return
      }

      this.fetchVideoInfo()
    },
    fetchVideoInfo() {
      this.isLoading = true
      // Simular busca de informações do vídeo
      // Depois será implementado com API real
      setTimeout(() => {
        this.videoData = {
          videoUrl:
            'https://media-files.videvo.net/demovideo/vimeo/sample_640x360.mp4',
          description: 'Dança do momento! 💃 #trending #dance',
          creator: 'Usuario Legal',
          handle: 'usuario_legal',
          creatorAvatar:
            'https://via.placeholder.com/40?text=Avatar',
          likes: '234.5K',
          comments: '1.2K',
          shares: '45.3K'
        }
        this.isLoading = false
      }, 1500)
    },
    download() {
      if (!this.videoData) {
        this.error = 'Nenhum vídeo carregado'
        return
      }

      // Será implementado depois com a API real
      this.$message.loading({
        content: 'Iniciando download...',
        duration: 0
      })

      setTimeout(() => {
        this.$message.success(
          `Download iniciado! (${this.downloadType === 'video' ? 'Vídeo' : 'Áudio'} - Qualidade: ${this.selectedQuality}${
            this.removeWatermark ? ' - Sem marca d\'água' : ''
          })`
        )
      }, 2000)
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

.video-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.video-preview {
  width: 100%;
  aspect-ratio: 9/16;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 500px;
}

.video-preview video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-details {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.creator-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.creator-info h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.handle {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.description {
  margin: 0;
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stats span {
  display: flex;
  align-items: center;
  gap: 4px;
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
.quality-options,
.extra-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-group h4,
.quality-options label,
.extra-options label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.option-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.option-btn,
.quality-btn {
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
.quality-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.option-btn.active,
.quality-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.quality-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
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
  margin: 0 0 12px 0;
  padding-left: 20px;
  font-size: 13px;
}

.info-box li {
  margin: 6px 0;
}

.note {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
}
</style>
