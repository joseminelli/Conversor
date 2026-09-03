<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-brands fa-instagram"></i> Baixador de Instagram</h1>
      <p>Baixe fotos, vídeos e stories do Instagram com qualidade original</p>
    </div>

    <div class="tool-content">
      <div class="input-section">
        <div class="url-input-group">
          <label for="instagram-url">Cole a URL ou username:</label>
          <div class="input-wrapper">
            <input
              id="instagram-url"
              v-model="instagramUrl"
              type="text"
              placeholder="https://www.instagram.com/p/... ou @username"
              class="url-input"
              @keyup.enter="validateAndFetch"
            />
            <button @click="validateAndFetch" class="btn btn-primary">
              <i class="fa-solid fa-magnifying-glass"></i> Buscar
            </button>
          </div>
          <small class="hint">Suporta: Posts, Reels, Stories e Perfis</small>
        </div>
      </div>

      <div class="loading" v-if="isLoading">
        <div class="spinner"></div>
        <p>Processando...</p>
      </div>

      <div class="post-info" v-if="postData && !isLoading">
        <div class="post-card">
          <div class="post-media">
            <img v-if="postData.type === 'image'" :src="postData.media[0]" :alt="postData.caption" />
            <video v-else-if="postData.type === 'video'" :src="postData.media[0]" controls></video>
            <div v-else-if="postData.type === 'carousel'" class="carousel-preview">
              <img :src="postData.media[0]" :alt="postData.caption" />
              <span class="media-count">+{{ postData.media.length - 1 }}</span>
            </div>
          </div>
          <div class="post-details">
            <div class="user-info">
              <img :src="postData.userAvatar" :alt="postData.username" class="avatar" />
              <div>
                <h4>{{ postData.username }}</h4>
                <p class="caption-text">{{ postData.caption }}</p>
              </div>
            </div>
            <div class="meta-info">
              <span><i class="fa-solid fa-heart"></i> {{ postData.likes }}</span>
              <span><i class="fa-solid fa-comment"></i> {{ postData.comments }}</span>
            </div>
          </div>
        </div>

        <div class="download-options">
          <div class="option-group">
            <h4>Selecione o que deseja baixar:</h4>
            <div class="option-buttons">
              <button
                v-if="postData.type === 'image'"
                @click="downloadType = 'image'"
                :class="['option-btn', { active: downloadType === 'image' }]"
              >
                <i class="fa-solid fa-image"></i> Imagem
              </button>
              <button
                v-if="postData.type === 'video' || postData.type === 'carousel'"
                @click="downloadType = 'video'"
                :class="['option-btn', { active: downloadType === 'video' }]"
              >
                <i class="fa-solid fa-film"></i> Vídeo
              </button>
              <button
                v-if="postData.type === 'carousel'"
                @click="downloadType = 'all'"
                :class="['option-btn', { active: downloadType === 'all' }]"
              >
                <i class="fa-solid fa-images"></i> Tudo (ZIP)
              </button>
            </div>
          </div>

          <div class="quality-options" v-if="downloadType === 'video' || downloadType === 'image'">
            <label>Qualidade:</label>
            <div class="quality-buttons">
              <button
                v-for="quality in ['original', 'high', 'medium']"
                :key="quality"
                @click="selectedQuality = quality"
                :class="['quality-btn', { active: selectedQuality === quality }]"
              >
                {{ quality.charAt(0).toUpperCase() + quality.slice(1) }}
              </button>
            </div>
          </div>

          <button @click="download" class="btn btn-success btn-large">
            <i class="fa-solid fa-download"></i>
            {{
              downloadType === 'image'
                ? 'Baixar Imagem'
                : downloadType === 'video'
                  ? 'Baixar Vídeo'
                  : 'Baixar Tudo (ZIP)'
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

      <div class="info-box" v-if="!postData && !isLoading && !error">
        <i class="fa-solid fa-circle-info"></i>
        <h4>Como usar:</h4>
        <ol>
          <li>Cole a URL de um post do Instagram (ex: instagram.com/p/ABC123)</li>
          <li>Ou digite o username de um perfil (ex: @nomedousuario)</li>
          <li>Clique em "Buscar" para carregar o conteúdo</li>
          <li>Escolha a qualidade desejada</li>
          <li>Clique em "Baixar" para salvar em seu dispositivo</li>
        </ol>
        <p class="note">⚠️ Respeite os direitos autorais ao baixar conteúdo alheio</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

interface PostData {
  type: 'image' | 'video' | 'carousel' | 'story'
  media: string[]
  caption: string
  username: string
  userAvatar: string
  likes: string
  comments: string
}

export default defineComponent({
  name: 'InstagramDownloaderView',
  data() {
    return {
      instagramUrl: '',
      postData: null as PostData | null,
      isLoading: false,
      error: '',
      downloadType: 'image',
      selectedQuality: 'original'
    }
  },
  methods: {
    validateAndFetch() {
      this.error = ''
      const input = this.instagramUrl.trim()

      if (!input) {
        this.error = 'Por favor, cole uma URL ou username'
        return
      }

      const urlRegex =
        /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|stories)\/[^\s]+$/
      const usernameRegex = /^@?[a-zA-Z0-9_.]+$/

      if (!urlRegex.test(input) && !usernameRegex.test(input)) {
        this.error = 'URL ou username inválido. Use instagram.com/p/... ou @username'
        return
      }

      this.fetchPostInfo()
    },
    fetchPostInfo() {
      this.isLoading = true
      // Simular busca de informações do post
      // Depois será implementado com API real
      setTimeout(() => {
        this.postData = {
          type: 'carousel',
          media: [
            'https://via.placeholder.com/400x500?text=Foto+1',
            'https://via.placeholder.com/400x500?text=Foto+2',
            'https://via.placeholder.com/400x500?text=Foto+3'
          ],
          caption: 'Melhor dia do mês! 🌟',
          username: 'seu_username',
          userAvatar:
            'https://via.placeholder.com/40?text=Avatar',
          likes: '1,234',
          comments: '45'
        }
        this.isLoading = false
      }, 1500)
    },
    download() {
      if (!this.postData) {
        this.error = 'Nenhum post carregado'
        return
      }

      // Será implementado depois com a API real
      this.$message.loading('Iniciando download...')

      setTimeout(() => {
        this.$message.success(
          `Download iniciado! (${this.downloadType.toUpperCase()} - Qualidade: ${this.selectedQuality})`
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

.post-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.post-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.post-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4/5;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.post-media img,
.post-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.carousel-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-count {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.post-details {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-info {
  display: flex;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.caption-text {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.meta-info span {
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
.quality-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-group h4,
.quality-options label {
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
