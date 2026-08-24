<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-compress"></i> Compressor de Imagem</h1>
      <p>Reduza o tamanho das suas imagens mantendo boa qualidade</p>
    </div>

    <div class="tool-content">
      <div class="upload-section" v-if="!originalImage">
        <FileDropZone
          accept="image/*"
          label="Clique ou arraste uma imagem aqui"
          hint="PNG, JPEG, WebP (máx. 10MB)"
          icon="fa-cloud-arrow-up"
          @file-selected="handleImageUpload"
        />
      </div>

      <div class="controls-panel" v-if="originalImage">
        <LabeledSlider
          id="quality"
          label="Qualidade"
          v-model="quality"
          :min="10"
          :max="100"
          suffix="%"
          @update:modelValue="compressImage"
        />

        <div class="control-group">
          <label for="max-width">Largura máxima (px)</label>
          <input
            id="max-width"
            v-model.number="maxWidth"
            type="number"
            placeholder="Deixe em branco para manter original"
            @input="compressImage"
          />
        </div>

        <div class="format-group">
          <label>Formato de saída:</label>
          <div class="format-options">
            <label>
              <input v-model="format" type="radio" value="jpeg" @change="compressImage" />
              JPEG
            </label>
            <label>
              <input v-model="format" type="radio" value="webp" @change="compressImage" />
              WebP
            </label>
            <label>
              <input v-model="format" type="radio" value="png" @change="compressImage" />
              PNG
            </label>
          </div>
        </div>
      </div>

      <div class="preview-section" v-if="originalImage && compressedDataUrl">
        <div class="preview-item">
          <h3>Original</h3>
          <img :src="originalImage.src" alt="Original" />
          <p class="file-size" v-if="originalFileSize">{{ originalFileSize }}</p>
        </div>

        <div class="preview-item">
          <h3>Comprimida</h3>
          <img :src="compressedDataUrl" alt="Comprimida" />
          <p class="file-size" v-if="compressedFileSize">{{ compressedFileSize }}</p>
        </div>
      </div>

      <div class="action-buttons" v-if="originalImage">
        <button @click="resetState" class="btn btn-secondary">
          <i class="fa-solid fa-arrow-rotate-left"></i> Nova Imagem
        </button>
        <button @click="downloadImage" class="btn btn-primary" :disabled="!compressedBlob">
          <i class="fa-solid fa-download"></i> Baixar Imagem
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import FileDropZone from '@/components/common/FileDropZone.vue'
import LabeledSlider from '@/components/common/LabeledSlider.vue'
import { formatFileSize, getCompressionPercentage } from '@/utils/file'

interface ImageState {
  originalImage: HTMLImageElement | null
  originalFile: File | null
  compressedBlob: Blob | null
  compressedDataUrl: string
  quality: number
  maxWidth: number | null
  format: 'jpeg' | 'webp' | 'png'
}

export default defineComponent({
  name: 'ImageCompressorView',
  components: {
    FileDropZone,
    LabeledSlider
  },
  data(): ImageState {
    return {
      originalImage: null,
      originalFile: null,
      compressedBlob: null,
      compressedDataUrl: '',
      quality: 80,
      maxWidth: null,
      format: 'jpeg'
    }
  },
  computed: {
    originalFileSize(): string {
      return this.originalFile ? `Original: ${formatFileSize(this.originalFile.size)}` : ''
    },
    compressedFileSize(): string {
      if (!this.compressedBlob) return ''
      const compression = getCompressionPercentage(
        this.originalFile?.size || 0,
        this.compressedBlob.size
      )
      return `Comprimida: ${formatFileSize(this.compressedBlob.size)} (${compression}% menor)`
    }
  },
  methods: {
    handleImageUpload(file: File) {
      if (!file.type.startsWith('image/')) {
        this.$message.error('Por favor, selecione uma imagem válida')
        return
      }

      this.originalFile = file
      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new Image()
        img.onload = async () => {
          this.originalImage = img
          await this.$nextTick()
          this.compressImage()
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    },

    compressImage() {
      if (!this.originalImage) return

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let width = this.originalImage.width
      let height = this.originalImage.height

      if (this.maxWidth && width > this.maxWidth) {
        const ratio = this.maxWidth / width
        width = this.maxWidth
        height = height * ratio
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(this.originalImage, 0, 0, width, height)

      const mimeType = this.format === 'jpeg' ? 'image/jpeg' : `image/${this.format}`
      const quality = this.quality / 100

      canvas.toBlob(
        (blob) => {
          if (blob) {
            this.compressedBlob = blob
            this.compressedDataUrl = URL.createObjectURL(blob)
          }
        },
        mimeType,
        quality
      )
    },

    downloadImage() {
      if (!this.compressedBlob || !this.originalFile) return

      const link = document.createElement('a')
      link.href = URL.createObjectURL(this.compressedBlob)
      link.download = `imagem-comprimida.${this.format}`
      link.click()
      URL.revokeObjectURL(link.href)
      this.$message.success('Imagem baixada com sucesso!')
    },

    resetState() {
      this.originalImage = null
      this.originalFile = null
      this.compressedBlob = null
      this.compressedDataUrl = ''
      this.quality = 80
      this.maxWidth = null
      this.format = 'jpeg'
    }
  }
})
</script>

<style scoped>
.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 50px 20px;
}

.tool-header {
  text-align: center;
  margin-bottom: 40px;
}

.tool-header h1 {
  font-size: 2rem;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.tool-header p {
  font-size: 1.1rem;
  opacity: 0.7;
  color: var(--text-color);
}

.tool-content {
  max-width: 550px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 30px;
}

.controls-panel {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.control-group {
  margin-bottom: 20px;
}

.control-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color);
}

.control-group input[type='number'] {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 1rem;
  box-sizing: border-box;
}

.format-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--text-color);
}

.format-options {
  display: flex;
  gap: 15px;
}

.format-options label {
  display: flex;
  align-items: center;
  font-weight: normal;
  margin-bottom: 0;
  cursor: pointer;
}

.format-options input[type='radio'] {
  margin-right: 8px;
  cursor: pointer;
}

.preview-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.preview-item {
  text-align: center;
}

.preview-item h3 {
  margin-bottom: 10px;
  color: var(--text-color);
}

.preview-item img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.file-size {
  font-size: 0.9rem;
  opacity: 0.7;
  color: var(--text-color);
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: var(--gradient);
  background-size: 200% 100%;
}

.btn-primary:hover:not(:disabled) {
  background-position: 100% 0;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-color);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .preview-section {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
