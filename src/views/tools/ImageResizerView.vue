<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-crop-simple"></i> Cortar e Redimensionar</h1>
      <p>Ajuste o enquadramento e a escala das suas imagens com precisão</p>
    </div>

    <div class="tool-content">
      <div class="upload-section" v-if="!originalImage">
        <FileDropZone
          accept="image/*"
          label="Clique ou arraste uma imagem aqui"
          hint="PNG, JPEG, WebP, etc."
          icon="fa-cloud-arrow-up"
          @file-selected="handleImageUpload"
        />
      </div>

      <div v-if="originalImage" class="editor-area">
        <div class="canvas-container">
          <canvas
            ref="imageCanvas"
            class="editor-canvas"
            :class="{ cropping: isCroppingEnabled }"
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @mouseleave="onCanvasMouseLeave"
          ></canvas>
        </div>

        <div class="controls-section">
          <div class="control-group">
            <label>
              <input v-model="isCroppingEnabled" type="checkbox" />
              Ativar corte
            </label>
            <button v-if="isCroppingEnabled" @click="resetCrop" class="btn btn-secondary">
              Resetar corte
            </button>
          </div>

          <LabeledSlider
            id="resize-slider"
            label="Escala"
            v-model="resizePercentage"
            :min="10"
            :max="200"
            suffix="%"
          />

          <div class="control-group">
            <label>Dimensões originais: {{ originalDimensions }}</label>
            <label>Dimensões finais: {{ finalDimensions }}</label>
          </div>

          <div class="control-group">
            <label for="format-select">Formato:</label>
            <select id="format-select" v-model="format" class="select-field">
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div class="control-group" v-if="format !== 'png'">
            <LabeledSlider
              id="quality-slider"
              label="Qualidade"
              v-model="quality"
              :min="10"
              :max="100"
              suffix="%"
            />
          </div>

          <button @click="downloadImage" class="btn btn-primary">
            <i class="fa-solid fa-download"></i> Baixar Imagem
          </button>
          <button @click="resetState" class="btn btn-secondary">
            <i class="fa-solid fa-arrow-rotate-left"></i> Nova Imagem
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import FileDropZone from '@/components/common/FileDropZone.vue'
import LabeledSlider from '@/components/common/LabeledSlider.vue'

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export default defineComponent({
  name: 'ImageResizerView',
  components: {
    FileDropZone,
    LabeledSlider
  },
  data() {
    return {
      originalImage: null as HTMLImageElement | null,
      originalFileName: '',
      isCroppingEnabled: false,
      isDragging: false,
      cropRect: {} as CropRect,
      startDrag: { x: 0, y: 0 },
      resizePercentage: 100,
      format: 'jpeg' as 'jpeg' | 'png' | 'webp',
      quality: 95
    }
  },
  computed: {
    originalDimensions(): string {
      if (!this.originalImage) return ''
      let width = this.originalImage.width
      let height = this.originalImage.height

      if (this.isCroppingEnabled && this.cropRect.width) {
        width = Math.abs(this.cropRect.width)
        height = Math.abs(this.cropRect.height)
      }

      return `${width} × ${height}`
    },
    finalDimensions(): string {
      const [width, height] = this.originalDimensions.split(' × ').map(x => parseInt(x))
      if (!width) return ''
      const scale = this.resizePercentage / 100
      return `${Math.round(width * scale)} × ${Math.round(height * scale)}`
    }
  },
  methods: {
    handleImageUpload(file: File) {
      if (!file.type.startsWith('image/')) {
        this.$message.error('Por favor, selecione uma imagem válida')
        return
      }

      this.originalFileName = file.name
      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new Image()
        img.onload = async () => {
          this.originalImage = img
          await this.$nextTick()
          this.redrawCanvas()
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    },

    redrawCanvas() {
      if (!this.originalImage) return

      const canvas = this.$refs.imageCanvas as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const containerWidth = canvas.parentElement?.clientWidth || 500
      const scale = Math.min(1, containerWidth / this.originalImage.width)
      canvas.width = this.originalImage.width * scale
      canvas.height = this.originalImage.height * scale

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height)

      if (this.isCroppingEnabled && this.cropRect.width && this.cropRect.height) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(this.cropRect.x, this.cropRect.y, this.cropRect.width, this.cropRect.height)
        ctx.clip()
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.strokeRect(this.cropRect.x, this.cropRect.y, this.cropRect.width, this.cropRect.height)
      }
    },

    onCanvasMouseDown(e: MouseEvent) {
      if (!this.isCroppingEnabled) return
      this.isDragging = true
      this.startDrag = { x: e.offsetX, y: e.offsetY }
      this.cropRect = { x: e.offsetX, y: e.offsetY, width: 0, height: 0 }
    },

    onCanvasMouseMove(e: MouseEvent) {
      if (!this.isCroppingEnabled || !this.isDragging) return
      this.cropRect.width = e.offsetX - this.startDrag.x
      this.cropRect.height = e.offsetY - this.startDrag.y
      this.redrawCanvas()
    },

    onCanvasMouseUp() {
      this.isDragging = false
    },

    onCanvasMouseLeave() {
      this.isDragging = false
    },

    resetCrop() {
      this.cropRect = {}
      this.redrawCanvas()
    },

    downloadImage() {
      if (!this.originalImage) return

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const sourceCanvas = this.$refs.imageCanvas as HTMLCanvasElement
      const scaleToCanvas = this.originalImage.width / sourceCanvas.width

      let sx = 0,
        sy = 0,
        sWidth = this.originalImage.width,
        sHeight = this.originalImage.height

      if (this.isCroppingEnabled && this.cropRect.width && this.cropRect.height) {
        sx = Math.min(this.startDrag.x, this.startDrag.x + this.cropRect.width) * scaleToCanvas
        sy = Math.min(this.startDrag.y, this.startDrag.y + this.cropRect.height) * scaleToCanvas
        sWidth = Math.abs(this.cropRect.width) * scaleToCanvas
        sHeight = Math.abs(this.cropRect.height) * scaleToCanvas
      }

      const scale = this.resizePercentage / 100
      const finalWidth = Math.round(sWidth * scale)
      const finalHeight = Math.round(sHeight * scale)

      canvas.width = finalWidth
      canvas.height = finalHeight

      ctx.drawImage(this.originalImage, sx, sy, sWidth, sHeight, 0, 0, finalWidth, finalHeight)

      const mimeType = this.format === 'jpeg' ? 'image/jpeg' : `image/${this.format}`
      const qualityValue = this.quality / 100

      const link = document.createElement('a')
      link.href = canvas.toDataURL(mimeType, qualityValue)
      link.download = `imagem-redimensionada.${this.format}`
      link.click()
      this.$message.success('Imagem baixada com sucesso!')
    },

    resetState() {
      this.originalImage = null
      this.originalFileName = ''
      this.isCroppingEnabled = false
      this.cropRect = {}
      this.resizePercentage = 100
      this.format = 'jpeg'
      this.quality = 95
    }
  }
})
</script>

<style scoped>
.container {
  max-width: 100%;
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
  max-width: 650px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 30px;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}

.canvas-container {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.editor-canvas {
  max-width: 100%;
  height: auto;
  cursor: default;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
}

.editor-canvas.cropping {
  cursor: crosshair;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-group label {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-color);
  gap: 8px;
}

.control-group input[type='checkbox'] {
  cursor: pointer;
}

.select-field {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
}

.btn {
  padding: 10px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-primary {
  background: var(--gradient);
  background-size: 200% 100%;
}

.btn-primary:hover {
  background-position: 100% 0;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-color);
}

@media (max-width: 1000px) {
  .editor-area {
    grid-template-columns: 1fr;
  }
}
</style>
