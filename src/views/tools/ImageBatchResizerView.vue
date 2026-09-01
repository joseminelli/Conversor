<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-images"></i> Redimensionador em Lote</h1>
      <p>Redimensione múltiplas imagens de uma vez com as mesmas configurações</p>
    </div>

    <div class="tool-content">
      <!-- Upload Section -->
      <div v-if="queueItems.length === 0" class="upload-section">
        <FileDropZone
          accept="image/*,.zip"
          label="Clique ou arraste imagens ou ZIPs aqui"
          hint="PNG, JPEG, WebP, etc. Ou um arquivo ZIP com múltiplas imagens"
          icon="fa-cloud-arrow-up"
          multiple
          :max-size-mb="100"
          :accept-types="['image/*']"
          @files-selected="handleFilesUpload"
          @file-rejected="onFileRejected"
        />
      </div>

      <!-- Configuration & Queue Section -->
      <div v-if="queueItems.length > 0" class="batch-section">
        <div class="config-panel">
          <h3><i class="fa-solid fa-sliders"></i> Configuração</h3>

          <div class="control-group">
            <LabeledSlider
              id="batch-scale-slider"
              label="Escala"
              v-model="resizePercentage"
              :min="10"
              :max="200"
              suffix="%"
            />
          </div>

          <div class="control-group">
            <label for="batch-format-select">Formato:</label>
            <select id="batch-format-select" v-model="format" class="select-field">
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div v-if="format !== 'png'" class="control-group">
            <LabeledSlider
              id="batch-quality-slider"
              label="Qualidade"
              v-model="quality"
              :min="10"
              :max="100"
              suffix="%"
            />
          </div>

          <div class="control-group info-box">
            <div class="info-item">
              <span class="label">Arquivos:</span>
              <span class="value">{{ queueItems.length }}</span>
            </div>
            <div class="info-item">
              <span class="label">Tamanho total:</span>
              <span class="value">{{ totalSize }}</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value" :class="`status-${currentStatus}`">{{ statusText }}</span>
            </div>
          </div>

          <button
            @click="startProcessing"
            :disabled="isProcessing"
            class="btn btn-primary"
          >
            <i :class="`fa-solid ${isProcessing ? 'fa-spinner' : 'fa-play'}`"></i>
            {{ isProcessing ? 'Processando...' : 'Iniciar Processamento' }}
          </button>
          <button
            v-if="!isProcessing"
            @click="resetState"
            class="btn btn-secondary"
          >
            <i class="fa-solid fa-arrow-rotate-left"></i> Limpar Fila
          </button>
        </div>

        <BatchQueueList :items="queueItems" :scale="resizePercentage" />

        <div v-if="isProcessing" class="processing-message">
          <i class="fa-solid fa-spinner"></i>
          Processando imagens... Não feche esta janela
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import FileDropZone from '@/components/common/FileDropZone.vue'
import LabeledSlider from '@/components/common/LabeledSlider.vue'
import BatchQueueList from '@/components/common/BatchQueueList.vue'
import { formatFileSize } from '@/utils/file'
import { downloadBlob } from '@/utils/download'
import { createZip } from '@/utils/zip'
import { extractImagesFromZip, filterImageFiles } from '@/utils/zip-extractor'
import type { BatchItem } from '@/types/batch'

export default defineComponent({
  name: 'ImageBatchResizerView',
  components: {
    FileDropZone,
    LabeledSlider,
    BatchQueueList
  },
  data() {
    return {
      queueItems: [] as BatchItem[],
      resizePercentage: 100,
      format: 'jpeg' as 'jpeg' | 'png' | 'webp',
      quality: 95,
      isProcessing: false,
      processedCount: 0
    }
  },
  computed: {
    totalSize(): string {
      const total = this.queueItems.reduce((sum, item) => sum + item.file.size, 0)
      return formatFileSize(total)
    },
    currentStatus(): string {
      if (this.isProcessing) return 'processing'
      if (this.processedCount === 0) return 'waiting'
      if (this.processedCount === this.queueItems.length) return 'done'
      return 'partial'
    },
    statusText(): string {
      if (this.isProcessing) return 'Processando...'
      if (this.processedCount === 0) return 'Aguardando'
      if (this.processedCount === this.queueItems.length) return 'Completo'
      return `${this.processedCount}/${this.queueItems.length}`
    }
  },
  methods: {
    async handleFilesUpload(files: File[]) {
      let filesToProcess: File[] = []

      for (const file of files) {
        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
          try {
            const extracted = await extractImagesFromZip(file)
            filesToProcess.push(...extracted)
            this.$message.success(`${extracted.length} imagem(ns) extraída(s)`)
          } catch (error) {
            this.$message.error(`Erro ao extrair ZIP`)
          }
        } else if (file.type.startsWith('image/')) {
          filesToProcess.push(file)
        }
      }

      if (filesToProcess.length === 0) {
        this.$message.error('Nenhuma imagem válida encontrada')
        return
      }

      filesToProcess.forEach((file, index) => {
        const item: BatchItem = {
          id: `${Date.now()}-${index}`,
          name: file.name,
          file,
          status: 'queued',
          progress: 0
        }

        this.queueItems.push(item)
        this.loadImageDimensions(item)
      })

      this.$message.success(`${filesToProcess.length} imagem(ns) adicionada(s) à fila`)
    },
    loadImageDimensions(item: BatchItem) {
      const reader = new FileReader()

      reader.onload = (event) => {
        const img = new Image()

        img.onload = () => {
          item.originalDimensions = {
            width: img.width,
            height: img.height
          }
        }

        img.onerror = () => {
          item.originalDimensions = undefined
        }

        img.src = event.target?.result as string
      }

      reader.readAsDataURL(item.file)
    },
    onFileRejected(rejection: { file: File; reason: string }) {
      this.$message.error(`${rejection.file.name}: ${rejection.reason}`)
    },
    async startProcessing() {
      if (this.isProcessing || this.queueItems.length === 0) return

      this.isProcessing = true
      this.processedCount = 0
      const processedFiles: { name: string; blob: Blob }[] = []
      const errors: string[] = []

      for (let i = 0; i < this.queueItems.length; i++) {
        const item = this.queueItems[i]
        item.status = 'processing'
        item.progress = 0

        try {
          const blob = await this.resizeImage(item.file)
          item.resultSize = blob.size
          item.progress = 100
          item.status = 'done'

          const fileName = this.getOutputFileName(item.file.name)
          processedFiles.push({ name: fileName, blob })
          this.processedCount++

          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          item.status = 'error'
          item.error = 'Erro ao processar imagem'
          errors.push(item.name)
        }
      }

      this.isProcessing = false

      if (processedFiles.length > 0) {
        if (processedFiles.length > 3) {
          await this.downloadAsZip(processedFiles)
        } else {
          this.downloadIndividual(processedFiles)
        }
      }

      if (errors.length > 0) {
        this.$message.error(`${errors.length} imagem(ns) com erro`)
      }
    },
    async resizeImage(file: File): Promise<Blob> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = async (event) => {
          try {
            const img = new Image()

            img.onload = async () => {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')

              if (!ctx) {
                reject(new Error('Não foi possível obter contexto do canvas'))
                return
              }

              const scale = this.resizePercentage / 100
              const finalWidth = Math.round(img.width * scale)
              const finalHeight = Math.round(img.height * scale)

              canvas.width = finalWidth
              canvas.height = finalHeight

              ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, finalWidth, finalHeight)

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob)
                  } else {
                    reject(new Error('Erro ao converter canvas para blob'))
                  }
                },
                `image/${this.format}`,
                this.format === 'png' ? undefined : this.quality / 100
              )
            }

            img.onerror = () => reject(new Error('Erro ao carregar imagem'))
            img.src = event.target?.result as string
          } catch (error) {
            reject(error)
          }
        }

        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        reader.readAsDataURL(file)
      })
    },
    getOutputFileName(originalName: string): string {
      const nameParts = originalName.split('.')
      nameParts[nameParts.length - 1] = this.format
      return nameParts.join('.')
    },
    async downloadAsZip(files: { name: string; blob: Blob }[]) {
      try {
        const zipBlob = await createZip(files)
        const timestamp = new Date().toISOString().slice(0, 10)
        downloadBlob(zipBlob, `imagens-redimensionadas-${timestamp}.zip`)
        this.$message.success(`${files.length} imagens compactadas e baixadas`)
      } catch (error) {
        this.$message.error('Erro ao criar arquivo ZIP')
      }
    },
    downloadIndividual(files: { name: string; blob: Blob }[]) {
      files.forEach(file => {
        downloadBlob(file.blob, file.name)
      })
      this.$message.success(`${files.length} imagem(ns) baixada(s)`)
    },
    resetState() {
      this.queueItems = []
      this.processedCount = 0
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
  max-width: 900px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 30px;
}

.batch-section {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
}

.config-panel {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.config-panel h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-panel i {
  color: var(--accent-color);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.info-box {
  background: rgba(138, 180, 248, 0.05);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 8px;
  padding: 12px;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.info-item .label {
  color: var(--text-color);
  opacity: 0.6;
}

.info-item .value {
  color: var(--text-color);
  font-weight: 500;
}

.status-waiting {
  color: rgba(107, 114, 128, 0.8);
}

.status-processing {
  color: var(--accent-color);
}

.status-partial {
  color: rgba(251, 191, 36, 0.8);
}

.status-done {
  color: #4ade80;
}

.btn {
  padding: 12px;
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
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-color);
}

.processing-message {
  grid-column: 1 / -1;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.processing-message i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .batch-section {
    grid-template-columns: 1fr;
  }

  .config-panel {
    position: static;
  }
}

@media (max-width: 768px) {
  .tool-header h1 {
    font-size: 1.5rem;
  }

  .config-panel {
    padding: 16px;
  }
}
</style>
