<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-file-pdf"></i> Conversor de Documentos</h1>
      <p>Converta entre PDF e imagens com facilidade</p>
    </div>

    <div class="tool-content">
      <!-- Mode Selector -->
      <div class="mode-selector">
        <button
          :class="['mode-btn', { active: mode === 'pdf-to-image' }]"
          @click="mode = 'pdf-to-image'"
        >
          <i class="fa-solid fa-file-pdf"></i> PDF → Imagem
        </button>
        <button
          :class="['mode-btn', { active: mode === 'image-to-pdf' }]"
          @click="mode = 'image-to-pdf'"
        >
          <i class="fa-solid fa-image"></i> Imagem → PDF
        </button>
      </div>

      <!-- PDF to Image -->
      <div v-if="mode === 'pdf-to-image'" class="mode-content">
        <div class="upload-section" v-if="!pdfFile">
          <FileDropZone
            accept=".pdf,application/pdf"
            label="Clique ou arraste um PDF aqui"
            hint="PDF (máx. 50MB)"
            icon="fa-cloud-arrow-up"
            @file-selected="handlePdfUpload"
          />
        </div>

        <div v-if="pdfFile && convertedImages.length > 0" class="controls-panel">
          <div class="control-group">
            <label for="format-select">Formato de saída:</label>
            <select id="format-select" v-model="imageFormat" class="select-field">
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </div>

          <div class="control-group" v-if="imageFormat === 'jpeg'">
            <LabeledSlider
              id="quality"
              label="Qualidade JPEG"
              v-model="jpegQuality"
              :min="50"
              :max="100"
              suffix="%"
            />
          </div>

          <div class="control-group">
            <label>Total de páginas: {{ convertedImages.length }}</label>
          </div>
        </div>

        <div v-if="pdfProcessing" class="processing-section">
          <ProgressBar :progress="pdfProgress" />
          <p class="progress-text">Convertendo página {{ currentPageNum }} de {{ totalPages }}...</p>
        </div>

        <div v-if="convertedImages.length > 0" class="preview-section">
          <div class="images-grid">
            <div v-for="(img, idx) in convertedImages" :key="idx" class="image-item">
              <img :src="img" :alt="`Página ${idx + 1}`" />
              <span class="page-label">Página {{ idx + 1 }}</span>
            </div>
          </div>
        </div>

        <div v-if="pdfFile && convertedImages.length > 0" class="action-buttons">
          <button @click="downloadPdfToImages" class="btn btn-primary">
            <i class="fa-solid fa-download"></i>
            {{ convertedImages.length > 1 ? 'Baixar ZIP' : 'Baixar Imagem' }}
          </button>
          <button @click="resetPdfToImage" class="btn btn-secondary">
            <i class="fa-solid fa-arrow-rotate-left"></i> Novo Arquivo
          </button>
        </div>
      </div>

      <!-- Image to PDF -->
      <div v-if="mode === 'image-to-pdf'" class="mode-content">
        <div class="upload-section" v-if="imagesToPdf.length === 0">
          <FileDropZone
            accept="image/*"
            label="Clique ou arraste imagens aqui"
            hint="PNG, JPEG, WebP (múltiplas)"
            icon="fa-cloud-arrow-up"
            multiple
            @files-selected="handleImagesUpload"
          />
        </div>

        <div v-if="imagesToPdf.length > 0" class="images-list">
          <div class="list-header">
            <h3>{{ imagesToPdf.length }} imagem(ns) selecionada(s)</h3>
            <button @click="imagesToPdf = []" class="btn-small btn-secondary">
              <i class="fa-solid fa-trash"></i> Limpar
            </button>
          </div>
          <div class="image-items">
            <div v-for="(img, idx) in imagesToPdf" :key="idx" class="image-item-small">
              <img :src="img.preview" :alt="img.name" />
              <div class="img-info">
                <span class="img-name">{{ img.name }}</span>
                <span class="img-size">{{ formatFileSize(img.size) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="pdfProcessing" class="processing-section">
          <ProgressBar :progress="pdfProgress" />
          <p class="progress-text">Criando PDF...</p>
        </div>

        <div v-if="imagesToPdf.length > 0" class="action-buttons">
          <button @click="downloadImagesToPdf" class="btn btn-primary" :disabled="pdfProcessing">
            <i class="fa-solid fa-download"></i> Gerar e Baixar PDF
          </button>
          <button @click="imagesToPdf = []" class="btn btn-secondary">
            <i class="fa-solid fa-arrow-rotate-left"></i> Limpar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, rgb } from 'pdf-lib'
import FileDropZone from '@/components/common/FileDropZone.vue'
import LabeledSlider from '@/components/common/LabeledSlider.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatFileSize } from '@/utils/file'
import { createZip } from '@/utils/zip'

interface ImageItem {
  name: string
  preview: string
  blob: Blob
  size: number
}

export default defineComponent({
  name: 'DocumentConverterView',
  components: {
    FileDropZone,
    LabeledSlider,
    ProgressBar
  },
  data() {
    return {
      mode: 'pdf-to-image' as 'pdf-to-image' | 'image-to-pdf',
      pdfFile: null as File | null,
      pdfProcessing: false,
      pdfProgress: 0,
      currentPageNum: 0,
      totalPages: 0,
      convertedImages: [] as string[],
      imageFormat: 'png' as 'png' | 'jpeg',
      jpegQuality: 90,
      imagesToPdf: [] as ImageItem[],
      formatFileSize
    }
  },
  mounted() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  },
  methods: {
    async handlePdfUpload(file: File) {
      this.pdfFile = file
      await this.convertPdfToImages()
    },

    async convertPdfToImages() {
      if (!this.pdfFile) return

      try {
        this.pdfProcessing = true
        this.pdfProgress = 0
        this.convertedImages = []

        const arrayBuffer = await this.pdfFile.arrayBuffer()
        const arrayBufferCopy = arrayBuffer.slice(0)
        const pdf = await pdfjsLib.getDocument({ data: arrayBufferCopy }).promise

        this.totalPages = pdf.numPages
        const images: string[] = []

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          this.currentPageNum = pageNum
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 2 })

          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) continue

          canvas.width = viewport.width
          canvas.height = viewport.height

          await (page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          }) as any).promise

          const dataUrl = canvas.toDataURL(
            this.imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
            this.imageFormat === 'jpeg' ? this.jpegQuality / 100 : undefined
          )

          images.push(dataUrl)
          this.pdfProgress = (pageNum / this.totalPages) * 100
        }

        this.convertedImages = images
      } catch (error) {
        this.$message.error('Erro ao converter PDF')
        console.error(error)
      } finally {
        this.pdfProcessing = false
      }
    },

    async downloadPdfToImages() {
      if (this.convertedImages.length === 0) return

      try {
        if (this.convertedImages.length === 1) {
          const link = document.createElement('a')
          link.href = this.convertedImages[0]
          link.download = `página.${this.imageFormat}`
          link.click()
        } else {
          const files = await Promise.all(
            this.convertedImages.map(async (dataUrl, idx) => ({
              name: `página-${idx + 1}.${this.imageFormat}`,
              blob: await this.dataUrlToBlob(dataUrl) as any
            }))
          )

          const zipBlob = await createZip(files as any)
          const link = document.createElement('a')
          link.href = URL.createObjectURL(zipBlob)
          link.download = 'pdf-convertido.zip'
          link.click()
          URL.revokeObjectURL(link.href)
        }
        this.$message.success('Download iniciado!')
      } catch (error) {
        this.$message.error('Erro ao baixar arquivos')
        console.error(error)
      }
    },

    async handleImagesUpload(files: File[]) {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue

        const reader = new FileReader()
        reader.onload = (event) => {
          this.imagesToPdf.push({
            name: file.name,
            preview: event.target?.result as string,
            blob: file,
            size: file.size
          })
        }
        reader.readAsDataURL(file)
      }
    },

    async downloadImagesToPdf() {
      if (this.imagesToPdf.length === 0) return

      try {
        this.pdfProcessing = true
        this.pdfProgress = 0

        const pdfDoc = await PDFDocument.create()

        for (let idx = 0; idx < this.imagesToPdf.length; idx++) {
          const item = this.imagesToPdf[idx]
          const imageBytes = await item.blob.arrayBuffer()

          let image
          const mimeType = item.blob.type

          if (mimeType === 'image/png') {
            image = await pdfDoc.embedPng(imageBytes)
          } else if (mimeType === 'image/jpeg') {
            image = await pdfDoc.embedJpg(imageBytes)
          } else {
            this.$message.warning(`Formato ${mimeType} não suportado, pulando ${item.name}`)
            continue
          }

          const { width, height } = image
          const page = pdfDoc.addPage([width, height])
          page.drawImage(image, { x: 0, y: 0, width, height })

          this.pdfProgress = ((idx + 1) / this.imagesToPdf.length) * 100
        }

        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })

        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'documento.pdf'
        link.click()
        URL.revokeObjectURL(link.href)

        this.$message.success('PDF gerado e baixado!')
        this.imagesToPdf = []
      } catch (error) {
        this.$message.error('Erro ao criar PDF')
        console.error(error)
      } finally {
        this.pdfProcessing = false
      }
    },

    async dataUrlToBlob(dataUrl: string): Promise<Blob> {
      const response = await fetch(dataUrl)
      return response.blob()
    },

    resetPdfToImage() {
      this.pdfFile = null
      this.convertedImages = []
      this.pdfProgress = 0
    }
  }
})
</script>

<style scoped>
.mode-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.mode-btn {
  flex: 1;
  padding: 12px 20px;
  background: rgba(138, 180, 248, 0.1);
  border: 1px solid rgba(138, 180, 248, 0.3);
  border-radius: 10px;
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.mode-btn:hover {
  background: rgba(138, 180, 248, 0.15);
  border-color: var(--accent-color);
}

.mode-btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.mode-content {
  animation: fadeIn 0.3s ease;
}

.upload-section {
  margin-bottom: 30px;
}

.controls-panel {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-group label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.95rem;
}

.select-field {
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(138, 180, 248, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-family);
}

.select-field:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 20px rgba(138, 180, 248, 0.2);
}

.processing-section {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  text-align: center;
}

.progress-text {
  margin-top: 16px;
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.7;
}

.preview-section {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(138, 180, 248, 0.2);
  background: rgba(40, 40, 40, 0.5);
}

.image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.page-label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.images-list {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: white;
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.85rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: rgba(138, 180, 248, 0.1);
  border: 1px solid rgba(138, 180, 248, 0.3);
  color: var(--accent-color);
}

.btn-secondary:hover {
  background: rgba(138, 180, 248, 0.15);
  border-color: var(--accent-color);
}

.image-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.image-item-small {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(138, 180, 248, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(138, 180, 248, 0.1);
}

.image-item-small img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.img-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.img-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.img-size {
  font-size: 0.8rem;
  color: var(--text-color);
  opacity: 0.6;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-family);
  flex: 1;
  min-width: 150px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--gradient);
  background-size: 200% 100%;
  box-shadow: 0 8px 20px rgba(138, 180, 248, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-position: 100% 0;
  box-shadow: 0 12px 30px rgba(138, 180, 248, 0.3);
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    flex: none;
  }
}
</style>
