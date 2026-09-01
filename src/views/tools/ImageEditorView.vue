<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-wand-magic-sparkles"></i> Editor de Imagem</h1>
      <p>Aplique filtros e ajustes como brilho, contraste, desfoque e muito mais</p>
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

      <div v-if="originalImage" class="editor-layout">
        <div class="canvas-section" v-if="editedImageDataUrl">
          <BeforeAfterSlider
            :beforeSrc="originalImage.src"
            :afterSrc="editedImageDataUrl"
            beforeLabel="Original"
            afterLabel="Editada"
          />
          <small v-if="canvasDimensions" style="margin-top: 12px">{{ canvasDimensions }}</small>
        </div>

        <canvas ref="editorCanvas" style="display: none"></canvas>

        <div class="controls-panel">
          <LabeledSlider
            id="brightness"
            label="Brilho"
            v-model="brightness"
            :min="0"
            :max="200"
            @update:modelValue="applyFilters"
          />

          <LabeledSlider
            id="contrast"
            label="Contraste"
            v-model="contrast"
            :min="0"
            :max="200"
            @update:modelValue="applyFilters"
          />

          <LabeledSlider
            id="saturation"
            label="Saturação"
            v-model="saturation"
            :min="0"
            :max="200"
            @update:modelValue="applyFilters"
          />

          <LabeledSlider
            id="hue"
            label="Matiz"
            v-model="hue"
            :min="-180"
            :max="180"
            @update:modelValue="applyFilters"
          />

          <LabeledSlider
            id="blur"
            label="Desfoque"
            v-model="blur"
            :min="0"
            :max="20"
            @update:modelValue="applyFilters"
          />

          <div class="filter-buttons">
            <button
              @click="toggleFilter('grayscale')"
              :class="['btn btn-filter', { active: filters.grayscale }]"
            >
              <i class="fa-solid fa-circle"></i> P&B
            </button>
            <button
              @click="toggleFilter('invert')"
              :class="['btn btn-filter', { active: filters.invert }]"
            >
              <i class="fa-solid fa-circle"></i> Inverter
            </button>
            <button
              @click="toggleFilter('sepia')"
              :class="['btn btn-filter', { active: filters.sepia }]"
            >
              <i class="fa-solid fa-circle"></i> Sépia
            </button>
          </div>

          <div class="action-buttons">
            <button @click="resetFilters" class="btn btn-secondary">
              <i class="fa-solid fa-arrow-rotate-left"></i> Resetar
            </button>
            <button @click="downloadImage" class="btn btn-primary">
              <i class="fa-solid fa-download"></i> Baixar
            </button>
            <button @click="resetState" class="btn btn-secondary">
              <i class="fa-solid fa-image"></i> Nova
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import FileDropZone from '@/components/common/FileDropZone.vue'
import LabeledSlider from '@/components/common/LabeledSlider.vue'
import BeforeAfterSlider from '@/components/common/BeforeAfterSlider.vue'

export default defineComponent({
  name: 'ImageEditorView',
  components: {
    FileDropZone,
    LabeledSlider,
    BeforeAfterSlider
  },
  data() {
    return {
      originalImage: null as HTMLImageElement | null,
      editedImageDataUrl: '',
      canvasDimensions: '',
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      filters: {
        grayscale: false,
        invert: false,
        sepia: false
      }
    }
  },
  methods: {
    async handleImageUpload(file: File) {
      if (!file.type.startsWith('image/')) {
        this.$message.error('Por favor, selecione uma imagem válida')
        return
      }

      const reader = new FileReader()
      reader.onload = async (event) => {
        const img = new Image()
        img.onload = async () => {
          this.originalImage = img
          await this.$nextTick()
          const canvas = this.$refs.editorCanvas as HTMLCanvasElement
          canvas.width = img.width
          canvas.height = img.height
          this.canvasDimensions = `${img.width} × ${img.height}`
          this.applyFilters()
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    },

    applyFilters() {
      if (!this.originalImage) return

      const canvas = this.$refs.editorCanvas as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const filterString = `
        brightness(${this.brightness / 100})
        contrast(${this.contrast / 100})
        saturate(${this.saturation / 100})
        hue-rotate(${this.hue}deg)
        blur(${this.blur}px)
      `

      ctx.filter = filterString
      ctx.drawImage(this.originalImage, 0, 0)

      if (this.filters.grayscale || this.filters.invert || this.filters.sepia) {
        this.applyPixelFilters(ctx)
      }

      this.editedImageDataUrl = canvas.toDataURL('image/png')
    },

    applyPixelFilters(ctx: CanvasRenderingContext2D) {
      const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]

        if (this.filters.grayscale) {
          const gray = r * 0.299 + g * 0.587 + b * 0.114
          r = g = b = gray
        }

        if (this.filters.invert) {
          r = 255 - r
          g = 255 - g
          b = 255 - b
        }

        if (this.filters.sepia) {
          const newR = (r * 0.393 + g * 0.769 + b * 0.189) / 3
          const newG = (r * 0.349 + g * 0.686 + b * 0.168) / 3
          const newB = (r * 0.272 + g * 0.534 + b * 0.131) / 3
          r = Math.min(255, newR + 40)
          g = Math.min(255, newG + 20)
          b = Math.min(255, newB)
        }

        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
      }

      ctx.putImageData(imageData, 0, 0)
    },

    toggleFilter(filterName: keyof typeof this.filters) {
      this.filters[filterName] = !this.filters[filterName]
      this.applyFilters()
    },

    resetFilters() {
      this.brightness = 100
      this.contrast = 100
      this.saturation = 100
      this.hue = 0
      this.blur = 0
      this.filters = {
        grayscale: false,
        invert: false,
        sepia: false
      }
      this.applyFilters()
      this.$message.success('Filtros resetados')
    },

    downloadImage() {
      const canvas = this.$refs.editorCanvas as HTMLCanvasElement
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = 'imagem-editada.png'
      link.click()
      this.$message.success('Imagem baixada com sucesso!')
    },

    resetState() {
      this.originalImage = null
      this.canvasDimensions = ''
      this.resetFilters()
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

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 25px;
  align-items: start;
}

.canvas-section {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.editor-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 10px;
  display: block;
}

.canvas-section small {
  opacity: 0.7;
  font-size: 0.85rem;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-filter {
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-filter:hover {
  border-color: var(--accent-color);
  background: rgba(138, 180, 248, 0.1);
}

.btn-filter.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #000;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 10px;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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
  .editor-layout {
    grid-template-columns: 1fr;
  }
}
</style>
