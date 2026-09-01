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
        <div class="comparison-info">
          <div class="size-info">
            <span>{{ originalFileSize }}</span>
            <span class="compression" v-if="compressedFileSize">{{ compressedFileSize }}</span>
          </div>
        </div>
        <BeforeAfterSlider
          :beforeSrc="originalDataUrl"
          :afterSrc="compressedDataUrl"
          beforeLabel="Comprimido"
          afterLabel="Original"
        />
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
import BeforeAfterSlider from '@/components/common/BeforeAfterSlider.vue'
import { formatFileSize, getCompressionPercentage } from '@/utils/file'

interface ImageState {
  originalImage: HTMLImageElement | null
  originalFile: File | null
  originalDataUrl: string
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
    LabeledSlider,
    BeforeAfterSlider
  },
  data(): ImageState {
    return {
      originalImage: null,
      originalFile: null,
      originalDataUrl: '',
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
        const dataUrl = event.target?.result as string
        this.originalDataUrl = dataUrl

        const img = new Image()
        img.onload = async () => {
          this.originalImage = img
          await this.$nextTick()
          this.compressImage()
        }
        img.src = dataUrl
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
      this.originalDataUrl = ''
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
.preview-section {
  margin-top: 30px;
}

.comparison-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(138, 180, 248, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(138, 180, 248, 0.15);
}

.size-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.size-info span {
  font-size: 0.9rem;
  color: var(--text-color);
}

.compression {
  color: var(--accent-color);
  font-weight: 600;
}
</style>
