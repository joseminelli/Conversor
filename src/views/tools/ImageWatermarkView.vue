<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-copyright"></i> Marca d'Água</h1>
      <p>Aplique um texto ou logo como marca d'água em suas imagens de forma fácil</p>
    </div>

    <div class="tool-content">
      <div class="upload-section" v-if="!mainImage">
        <FileDropZone
          accept="image/*"
          label="Clique ou arraste uma imagem aqui"
          hint="PNG, JPEG, WebP, etc."
          icon="fa-cloud-arrow-up"
          @file-selected="handleMainImageUpload"
        />
      </div>

      <div class="editor-area" v-if="mainImage">
        <div class="canvas-wrapper">
          <canvas
            ref="imageCanvas"
            class="editor-canvas">
          </canvas>
        </div>

        <div class="controls-panel">
          <div class="tab-buttons">
            <button
              @click="options.type = 'text'"
              :class="['tab-btn', { active: options.type === 'text' }]"
            >
              Texto
            </button>
            <button
              @click="options.type = 'image'"
              :class="['tab-btn', { active: options.type === 'image' }]"
            >
              Logo
            </button>
          </div>

          <div class="tab-content" v-if="options.type === 'text'">
            <div class="control-group">
              <label for="watermark-text">Texto:</label>
              <input
                id="watermark-text"
                v-model="options.text"
                type="text"
                placeholder="Sua Marca"
                @input="redrawCanvas"
              />
            </div>

            <div class="control-group">
              <label for="watermark-color">Cor:</label>
              <input
                id="watermark-color"
                v-model="options.color"
                type="color"
                @input="redrawCanvas"
              />
            </div>

            <LabeledSlider
              id="text-size"
              label="Tamanho (px)"
              v-model="options.size"
              :min="10"
              :max="200"
              @update:modelValue="redrawCanvas"
            />
          </div>

          <div class="tab-content" v-if="options.type === 'image'">
            <div class="control-group">
              <label for="logo-upload">Fazer upload do logo:</label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                @change="handleLogoUpload"
              />
              <small v-if="logoFileName">{{ logoFileName }}</small>
            </div>

            <LabeledSlider
              id="logo-size"
              label="Tamanho (%)"
              v-model="options.size"
              :min="1"
              :max="100"
              @update:modelValue="redrawCanvas"
            />
          </div>

          <LabeledSlider
            id="opacity"
            label="Opacidade"
            v-model="options.opacity"
            :min="0"
            :max="100"
            suffix="%"
            @update:modelValue="redrawCanvas"
          />

          <div class="position-grid">
            <label>Posição:</label>
            <div class="grid">
              <button
                v-for="pos in positions"
                :key="pos"
                @click="options.position = pos"
                :class="['pos-btn', { active: options.position === pos }]"
                :title="pos"
              >
              </button>
            </div>
          </div>

          <div class="control-group">
            <label for="format-select">Formato:</label>
            <select id="format-select" v-model="format" class="select-field">
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <button @click="downloadImage" class="btn btn-primary">
            <i class="fa-solid fa-download"></i> Baixar
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

export default defineComponent({
  name: 'ImageWatermarkView',
  components: {
    FileDropZone,
    LabeledSlider
  },
  data() {
    return {
      mainImage: null as HTMLImageElement | null,
      watermarkImage: null as HTMLImageElement | null,
      logoFileName: '',
      format: 'jpeg' as 'jpeg' | 'png' | 'webp',
      positions: [
        'top-left',
        'top-center',
        'top-right',
        'center-left',
        'center',
        'center-right',
        'bottom-left',
        'bottom-center',
        'bottom-right'
      ],
      options: {
        type: 'text' as 'text' | 'image',
        text: 'Sua Marca',
        color: '#FFFFFF',
        size: 30,
        opacity: 0.5,
        position: 'center'
      }
    }
  },
  methods: {
    async handleMainImageUpload(file: File) {
      if (!file.type.startsWith('image/')) {
        this.$message.error('Por favor, selecione uma imagem válida')
        return
      }

      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new Image()
        img.onload = async () => {
          this.mainImage = img
          await this.$nextTick()
          this.redrawCanvas()
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    },

    handleLogoUpload(event: Event) {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (!file) return

      this.logoFileName = file.name
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          this.watermarkImage = img
          this.redrawCanvas()
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    },

    redrawCanvas() {
      if (!this.mainImage) return

      const canvas = this.$refs.imageCanvas as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = this.mainImage.width
      canvas.height = this.mainImage.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(this.mainImage, 0, 0)

      ctx.globalAlpha = this.options.opacity / 100

      let watermarkWidth = 0
      let watermarkHeight = 0

      if (this.options.type === 'text') {
        ctx.fillStyle = this.options.color
        ctx.font = `bold ${this.options.size}px Arial, sans-serif`
        const metrics = ctx.measureText(this.options.text)
        watermarkWidth = metrics.width
        watermarkHeight = this.options.size
      } else if (this.watermarkImage) {
        const scale = (this.options.size / 100) * (canvas.width / this.watermarkImage.width)
        watermarkWidth = this.watermarkImage.width * scale
        watermarkHeight = this.watermarkImage.height * scale
      }

      const { x, y } = this.calculatePosition(watermarkWidth, watermarkHeight)

      if (this.options.type === 'text') {
        ctx.fillText(this.options.text, x, y + watermarkHeight)
      } else if (this.watermarkImage) {
        ctx.drawImage(
          this.watermarkImage,
          x,
          y,
          watermarkWidth,
          watermarkHeight
        )
      }

      ctx.globalAlpha = 1.0
    },

    calculatePosition(w: number, h: number) {
      const margin = 0.02 * (this.$refs.imageCanvas as HTMLCanvasElement).width
      const canvasWidth = (this.$refs.imageCanvas as HTMLCanvasElement).width
      const canvasHeight = (this.$refs.imageCanvas as HTMLCanvasElement).height
      let x = 0,
        y = 0

      switch (this.options.position) {
        case 'top-left':
          x = margin
          y = 0
          break
        case 'top-center':
          x = (canvasWidth - w) / 2
          y = 0
          break
        case 'top-right':
          x = canvasWidth - w - margin
          y = 0
          break
        case 'center-left':
          x = margin
          y = (canvasHeight - h) / 2
          break
        case 'center':
          x = (canvasWidth - w) / 2
          y = (canvasHeight - h) / 2
          break
        case 'center-right':
          x = canvasWidth - w - margin
          y = (canvasHeight - h) / 2
          break
        case 'bottom-left':
          x = margin
          y = canvasHeight - h
          break
        case 'bottom-center':
          x = (canvasWidth - w) / 2
          y = canvasHeight - h
          break
        case 'bottom-right':
          x = canvasWidth - w - margin
          y = canvasHeight - h
          break
      }

      if (this.options.type === 'text') y += this.options.size * 0.8
      return { x, y }
    },

    downloadImage() {
      if (!this.mainImage) return

      const canvas = this.$refs.imageCanvas as HTMLCanvasElement
      const mimeType = this.format === 'jpeg' ? 'image/jpeg' : `image/${this.format}`
      const quality = this.format !== 'png' ? 0.95 : undefined

      const link = document.createElement('a')
      link.href = canvas.toDataURL(mimeType, quality)
      link.download = `marcadagua.${this.format}`
      link.click()
      this.$message.success('Imagem baixada com sucesso!')
    },

    resetState() {
      this.mainImage = null
      this.watermarkImage = null
      this.logoFileName = ''
      this.options = {
        type: 'text',
        text: 'Sua Marca',
        color: '#FFFFFF',
        size: 30,
        opacity: 0.5,
        position: 'center'
      }
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
  max-width: 900px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 30px;
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 25px;
  align-items: start;
}

.canvas-wrapper {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.editor-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tab-buttons {
  display: flex;
  gap: 10px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.tab-btn:hover {
  border-color: var(--accent-color);
}

.tab-btn.active {
  background: var(--accent-color);
  color: #000;
  border-color: var(--accent-color);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-color);
}

.control-group input[type='text'],
.control-group input[type='color'],
.control-group input[type='file'],
.select-field {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.9rem;
}

.control-group input[type='color'] {
  height: 40px;
  cursor: pointer;
}

.control-group input[type='file'] {
  display: none;
}

.control-group small {
  opacity: 0.6;
  font-size: 0.8rem;
}

.position-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.position-grid label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-color);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.pos-btn {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pos-btn:hover {
  border-color: var(--accent-color);
}

.pos-btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.btn {
  padding: 10px;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.9rem;
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
