<template>
  <label
    :for="inputId"
    class="file-upload-zone"
    :class="{ 'drag-over': isDragging }"
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
      default: () => `file-input-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  emits: ['file-selected'],
  data() {
    return {
      isDragging: false
    }
  },
  methods: {
    onDragOver() {
      this.isDragging = true
    },
    onDragLeave() {
      this.isDragging = false
    },
    onDrop(event: DragEvent) {
      this.isDragging = false
      const files = event.dataTransfer?.files
      if (files && files[0]) {
        this.handleFile(files[0])
      }
    },
    handleFileChange(event: Event) {
      const input = event.target as HTMLInputElement
      if (input.files && input.files[0]) {
        this.handleFile(input.files[0])
      }
    },
    handleFile(file: File) {
      this.$emit('file-selected', file)
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
