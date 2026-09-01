<template>
  <label
    :for="inputId"
    class="file-upload-zone"
    :class="{ 'drag-over': isDragging, 'drag-reject': isDraggingReject }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <i :class="`fa-solid ${icon}`"></i>
    <p>{{ label }}</p>
    <small>{{ hint }}</small>
    <input
      :id="inputId"
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      @change="handleFileChange"
    />
  </label>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FileDropZone',
  props: {
    accept: {
      type: String,
      default: '*'
    },
    label: {
      type: String,
      default: 'Clique ou arraste um arquivo aqui'
    },
    hint: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'fa-cloud-arrow-up'
    },
    inputId: {
      type: String,
      default: () => `file-input-${Math.random().toString(36).substring(2, 9)}`
    },
    multiple: {
      type: Boolean,
      default: false
    },
    maxSizeMB: {
      type: Number,
      default: 0
    },
    acceptTypes: {
      type: Array as () => string[],
      default: () => []
    }
  },
  emits: ['file-selected', 'files-selected', 'file-rejected'],
  data() {
    return {
      isDragging: false,
      isDraggingReject: false
    }
  },
  methods: {
    isValidFile(file: File): { valid: boolean; reason?: string } {
      if (this.maxSizeMB > 0 && file.size > this.maxSizeMB * 1024 * 1024) {
        return {
          valid: false,
          reason: `Arquivo muito grande (máx: ${this.maxSizeMB}MB)`
        }
      }

      const isZip = file.type === 'application/zip' || file.name.endsWith('.zip')

      if (this.acceptTypes.length > 0 && !isZip) {
        const isAccepted = this.acceptTypes.some(type => {
          if (type.includes('*')) {
            const [mainType] = type.split('/')
            return file.type.startsWith(mainType)
          }
          return file.type === type
        })

        if (!isAccepted) {
          return {
            valid: false,
            reason: `Formato não aceito (aceitos: ${this.acceptTypes.join(', ')})`
          }
        }
      }

      return { valid: true }
    },
    onDragOver(event: DragEvent) {
      if (event.dataTransfer?.items) {
        const hasInvalidType = Array.from(event.dataTransfer.items).some(item => {
          if (this.acceptTypes.length === 0) return false

          const isZip = item.type === 'application/zip'
          if (isZip) return false

          return !this.acceptTypes.some(type => {
            if (type.includes('*')) {
              const [mainType] = type.split('/')
              return item.type.startsWith(mainType)
            }
            return item.type === type
          })
        })

        if (hasInvalidType) {
          this.isDraggingReject = true
          this.isDragging = false
        } else {
          this.isDragging = true
          this.isDraggingReject = false
        }
      } else {
        this.isDragging = true
        this.isDraggingReject = false
      }
    },
    onDragLeave() {
      this.isDragging = false
      this.isDraggingReject = false
    },
    onDrop(event: DragEvent) {
      this.isDragging = false
      this.isDraggingReject = false
      const files = event.dataTransfer?.files
      if (!files) return

      if (this.multiple) {
        const validFiles: File[] = []
        const invalidFiles: { file: File; reason: string }[] = []

        Array.from(files).forEach(file => {
          const validation = this.isValidFile(file)
          if (validation.valid) {
            validFiles.push(file)
          } else {
            invalidFiles.push({ file, reason: validation.reason || 'Arquivo inválido' })
          }
        })

        if (validFiles.length > 0) {
          this.$emit('files-selected', validFiles)
        }

        if (invalidFiles.length > 0) {
          this.$emit('file-rejected', invalidFiles[0])
        }
      } else {
        if (files[0]) {
          const validation = this.isValidFile(files[0])
          if (validation.valid) {
            this.$emit('file-selected', files[0])
          } else {
            this.$emit('file-rejected', { file: files[0], reason: validation.reason })
          }
        }
      }
    },
    handleFileChange(event: Event) {
      const input = event.target as HTMLInputElement
      if (!input.files) return

      if (this.multiple) {
        const validFiles: File[] = []
        const invalidFiles: { file: File; reason: string }[] = []

        Array.from(input.files).forEach(file => {
          const validation = this.isValidFile(file)
          if (validation.valid) {
            validFiles.push(file)
          } else {
            invalidFiles.push({ file, reason: validation.reason || 'Arquivo inválido' })
          }
        })

        if (validFiles.length > 0) {
          this.$emit('files-selected', validFiles)
        }

        if (invalidFiles.length > 0) {
          this.$emit('file-rejected', invalidFiles[0])
        }
      } else {
        if (input.files[0]) {
          const validation = this.isValidFile(input.files[0])
          if (validation.valid) {
            this.$emit('file-selected', input.files[0])
          } else {
            this.$emit('file-rejected', { file: input.files[0], reason: validation.reason })
          }
        }
      }
    }
  }
})
</script>

<style scoped>
.file-upload-zone {
  display: block;
  padding: 40px 20px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  background: var(--input-bg);
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.file-upload-zone:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: var(--accent-color);
  transform: scale(1.02);
}

.file-upload-zone.drag-over {
  background-color: rgba(139, 180, 248, 0.1);
  border-color: var(--accent-color);
  transform: scale(1.02);
}

.file-upload-zone.drag-reject {
  background-color: rgba(248, 113, 113, 0.1);
  border-color: #f87171;
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.file-upload-zone i {
  font-size: 2.5rem;
  color: var(--accent-color);
  margin-bottom: 10px;
  display: block;
}

.file-upload-zone p {
  margin: 10px 0 5px 0;
  font-weight: 500;
  color: var(--text-color);
}

.file-upload-zone small {
  opacity: 0.6;
  display: block;
  color: var(--text-color);
  font-size: 0.85rem;
}

input[type='file'] {
  display: none;
}
</style>
