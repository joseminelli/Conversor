<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-file-zipper"></i> Compressor de PDF</h1>
      <p>Reduza o tamanho dos seus PDFs com dois modos diferentes</p>
    </div>

    <div class="tool-content">
      <div class="upload-section" v-if="!pdfFile">
        <FileDropZone
          accept=".pdf,application/pdf"
          label="Clique ou arraste um PDF aqui"
          hint="PDF (máx. 50MB)"
          icon="fa-cloud-arrow-up"
          @file-selected="handlePdfUpload"
        />
      </div>

      <div v-if="pdfFile" class="controls-panel">
        <div class="control-group">
          <label>Modo de compressão:</label>
          <div class="mode-options">
            <label class="option">
              <input v-model="compressionMode" type="radio" value="safe" />
              <div class="option-content">
                <span class="option-title">Seguro</span>
                <span class="option-desc">Otimização estrutural, sem perda visual</span>
              </div>
            </label>
            <label class="option">
              <input v-model="compressionMode" type="radio" value="aggressive" />
              <div class="option-content">
                <span class="option-title">Agressivo</span>
                <span class="option-desc">Rasteriza com compressão JPEG</span>
              </div>
            </label>
          </div>
        </div>

        <div v-if="compressionMode === 'aggressive'" class="control-group">
          <LabeledSlider
            id="quality"
            label="Qualidade da compressão"
            v-model="jpegQuality"
            :min="30"
            :max="90"
            suffix="%"
          />
          <small>Valores menores = arquivo menor, qualidade pior</small>
        </div>
      </div>

      <div v-if="processing" class="processing-section">
        <ProgressBar :progress="progress" />
        <p class="progress-text">
          {{ compressionMode === 'safe' ? 'Otimizando PDF...' : 'Comprimindo (página ' + currentPage + '/' + totalPages + ')...' }}
        </p>
      </div>

      <div v-if="pdfFile && compressedBlob" class="preview-section">
        <div class="comparison-info">
          <div class="size-info">
            <span>{{ originalSize }}</span>
            <span class="compression" v-if="compressedSize">{{ compressedSize }}</span>
          </div>
        </div>
      </div>

      <div v-if="pdfFile" class="action-buttons">
        <button @click="downloadCompressed" class="btn btn-primary" :disabled="!compressedBlob || processing">
          <i class="fa-solid fa-download"></i> Baixar PDF Comprimido
        </button>
        <button @click="resetState" class="btn btn-secondary">
          <i class="fa-solid fa-arrow-rotate-left"></i> Novo Arquivo
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument } from 'pdf-lib'
import FileDropZone from '@/components/common/FileDropZone.vue'
import LabeledSlider from '@/components/common/LabeledSlider.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatFileSize, getCompressionPercentage } from '@/utils/file'

export default defineComponent({
  name: 'PdfCompressorView',
  components: {
    FileDropZone,
    LabeledSlider,
    ProgressBar
  },
  data() {
    return {
      pdfFile: null as File | null,
      pdfArrayBuffer: null as ArrayBuffer | null,
      compressionMode: 'safe' as 'safe' | 'aggressive',
      jpegQuality: 70,
      processing: false,
      progress: 0,
      currentPage: 0,
      totalPages: 0,
      compressedBlob: null as Blob | null
    }
  },
  computed: {
    originalSize(): string {
      return this.pdfFile ? `Original: ${formatFileSize(this.pdfFile.size)}` : ''
    },
    compressedSize(): string {
      if (!this.compressedBlob) return ''
      const compression = getCompressionPercentage(
        this.pdfFile?.size || 0,
        this.compressedBlob.size
      )
      return `Comprimido: ${formatFileSize(this.compressedBlob.size)} (${compression}% menor)`
    }
  },
  watch: {
    compressionMode() {
      if (this.pdfArrayBuffer) {
        this.compressPdf()
      }
    },
    jpegQuality() {
      if (this.pdfArrayBuffer && this.compressionMode === 'aggressive') {
        this.compressPdf()
      }
    }
  },
  mounted() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  },
  methods: {
    async handlePdfUpload(file: File) {
      this.pdfFile = file
      this.pdfArrayBuffer = await file.arrayBuffer()
      this.compressedBlob = null
      await this.compressPdf()
    },

    async compressPdf() {
      if (!this.pdfArrayBuffer) return

      try {
        this.processing = true
        this.progress = 0

        if (this.compressionMode === 'safe') {
          await this.compressSafe()
        } else {
          await this.compressAggressive()
        }
      } catch (error) {
        this.$message.error('Erro ao comprimir PDF')
        console.error(error)
      } finally {
        this.processing = false
      }
    },

    async compressSafe() {
      const arrayBufferCopy = this.pdfArrayBuffer!.slice(0)
      const pdfDoc = await PDFDocument.load(arrayBufferCopy)

      pdfDoc.setProducer('PDF Compressor')
      pdfDoc.setCreationDate(new Date())

      const pdfBytes = await pdfDoc.save({ useObjectStreams: true })
      this.compressedBlob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      this.progress = 100
    },

    async compressAggressive() {
      const arrayBufferCopy = this.pdfArrayBuffer!.slice(0)
      const pdf = await pdfjsLib.getDocument({ data: arrayBufferCopy }).promise
      this.totalPages = pdf.numPages

      const pdfDoc = await PDFDocument.create()

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        this.currentPage = pageNum

        try {
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1.5 })

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

          const imageData = canvas.toDataURL('image/jpeg', this.jpegQuality / 100)
          const response = await fetch(imageData)
          const imageBytes = await response.arrayBuffer()

          const image = await pdfDoc.embedJpg(imageBytes)
          const { width, height } = image
          const pdfPage = pdfDoc.addPage([width, height])
          pdfPage.drawImage(image, { x: 0, y: 0, width, height })
        } catch (err) {
          console.warn(`Erro ao processar página ${pageNum}:`, err)
        }

        this.progress = (pageNum / this.totalPages) * 100
      }

      const pdfBytes = await pdfDoc.save()
      this.compressedBlob = new Blob([pdfBytes as any], { type: 'application/pdf' })
    },

    downloadCompressed() {
      if (!this.compressedBlob) return

      const link = document.createElement('a')
      link.href = URL.createObjectURL(this.compressedBlob)
      link.download = 'pdf-comprimido.pdf'
      link.click()
      URL.revokeObjectURL(link.href)
      this.$message.success('PDF baixado com sucesso!')
    },

    resetState() {
      this.pdfFile = null
      this.pdfArrayBuffer = null
      this.compressedBlob = null
      this.progress = 0
      this.compressionMode = 'safe'
      this.jpegQuality = 70
    }
  }
})
</script>

<style scoped>
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

.control-group small {
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.6;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(138, 180, 248, 0.05);
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option:hover {
  background: rgba(138, 180, 248, 0.1);
  border-color: rgba(138, 180, 248, 0.4);
}

.option input[type='radio'] {
  cursor: pointer;
  accent-color: var(--accent-color);
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-title {
  font-weight: 600;
  color: white;
  font-size: 0.95rem;
}

.option-desc {
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.7;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  backdrop-filter: blur(10px);
}

.comparison-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.btn-secondary {
  background: rgba(138, 180, 248, 0.1);
  border: 1px solid rgba(138, 180, 248, 0.3);
  color: var(--accent-color);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(138, 180, 248, 0.15);
  border-color: var(--accent-color);
  box-shadow: 0 8px 20px rgba(138, 180, 248, 0.15);
}

@media (max-width: 768px) {
  .preview-section {
    grid-template-columns: 1fr;
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
