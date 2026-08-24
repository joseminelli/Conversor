<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-eye-dropper"></i> Conta-gotas de Cores</h1>
      <p>Carregue uma imagem e capture o código de qualquer cor com precisão</p>
    </div>

    <div class="tool-content">
      <div class="upload-section" v-if="!imageLoaded">
        <FileDropZone
          accept="image/*"
          label="Clique ou arraste uma imagem aqui"
          hint="PNG, JPEG, WebP, etc."
          icon="fa-cloud-arrow-up"
          @file-selected="handleImageUpload"
        />
      </div>

      <div class="canvas-section" v-if="imageLoaded">
        <div class="canvas-wrapper">
          <canvas
            ref="imageCanvas"
            :key="`color-canvas-${Date.now()}`"
            :width="canvasWidth"
            :height="canvasHeight"
            @mousemove="onCanvasMouseMove"
          />
        </div>

        <div class="color-details">
          <div class="color-swatch" :style="{ backgroundColor: currentColor }"></div>

          <div class="color-inputs">
            <div class="input-group">
              <label for="hex-value">HEX</label>
              <div class="input-with-copy">
                <input id="hex-value" v-model="hexValue" readonly type="text" />
                <button @click="copyToClipboard('hex')" class="copy-btn" title="Copiar HEX">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </div>

            <div class="input-group">
              <label for="rgb-value">RGB</label>
              <div class="input-with-copy">
                <input id="rgb-value" v-model="rgbValue" readonly type="text" />
                <button @click="copyToClipboard('rgb')" class="copy-btn" title="Copiar RGB">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </div>

            <div class="input-group">
              <label for="hsl-value">HSL</label>
              <div class="input-with-copy">
                <input id="hsl-value" v-model="hslValue" readonly type="text" />
                <button @click="copyToClipboard('hsl')" class="copy-btn" title="Copiar HSL">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <button @click="resetState" class="btn btn-secondary">
          <i class="fa-solid fa-arrow-rotate-left"></i> Nova Imagem
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import FileDropZone from '@/components/common/FileDropZone.vue'
import { rgbToHex, rgbToHsl } from '@/utils/color'

export default defineComponent({
  name: 'ColorPickerView',
  components: {
    FileDropZone
  },
  data() {
    return {
      imageLoaded: false,
      canvasWidth: 0,
      canvasHeight: 0,
      currentColor: '#000000',
      hexValue: '#000000',
      rgbValue: 'rgb(0, 0, 0)',
      hslValue: 'hsl(0, 0%, 0%)'
    }
  },
  methods: {
    async handleImageUpload(file: File) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new Image()
        img.onload = async () => {
          await this.$nextTick()
          const canvas = this.$refs.imageCanvas as HTMLCanvasElement
          canvas.width = img.width
          canvas.height = img.height
          this.canvasWidth = img.width
          this.canvasHeight = img.height

          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (ctx) {
            ctx.drawImage(img, 0, 0)
          }
          this.imageLoaded = true
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    },

    onCanvasMouseMove(event: MouseEvent) {
      if (!this.imageLoaded) return

      const canvas = this.$refs.imageCanvas as HTMLCanvasElement
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      const x = Math.floor((event.clientX - rect.left) * scaleX)
      const y = Math.floor((event.clientY - rect.top) * scaleY)

      const pixel = ctx.getImageData(x, y, 1, 1).data
      const r = pixel[0]
      const g = pixel[1]
      const b = pixel[2]

      this.updateColorDetails(r, g, b)
    },

    updateColorDetails(r: number, g: number, b: number) {
      this.currentColor = `rgb(${r}, ${g}, ${b})`
      this.hexValue = rgbToHex(r, g, b)
      this.rgbValue = `rgb(${r}, ${g}, ${b})`
      this.hslValue = rgbToHsl(r, g, b)
    },

    async copyToClipboard(type: 'hex' | 'rgb' | 'hsl') {
      const valueToCopy = type === 'hex' ? this.hexValue : type === 'rgb' ? this.rgbValue : this.hslValue
      try {
        await navigator.clipboard.writeText(valueToCopy)
        this.$message.success(`${type.toUpperCase()} copiado!`)
      } catch {
        this.$message.error('Erro ao copiar')
      }
    },

    resetState() {
      this.imageLoaded = false
      this.canvasWidth = 0
      this.canvasHeight = 0
      this.currentColor = '#000000'
      this.hexValue = '#000000'
      this.rgbValue = 'rgb(0, 0, 0)'
      this.hslValue = 'hsl(0, 0%, 0%)'
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
  max-width: 550px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 30px;
}

.canvas-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.canvas-wrapper {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.canvas-wrapper canvas {
  max-width: 100%;
  height: auto;
  cursor: crosshair;
  border-radius: 8px;
}

.color-details {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 20px;
}

.color-swatch {
  width: 100%;
  height: 100px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.color-inputs {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-weight: 500;
  margin-bottom: 5px;
  color: var(--text-color);
  font-size: 0.9rem;
}

.input-with-copy {
  display: flex;
  gap: 10px;
}

.input-with-copy input {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
}

.copy-btn {
  padding: 10px 15px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.btn {
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

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-color);
}
</style>
