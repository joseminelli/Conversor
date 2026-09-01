<template>
  <div v-if="items.length > 0" class="batch-queue">
    <div class="queue-header">
      <h3>
        <i class="fa-solid fa-list-check"></i>
        Fila de Processamento
      </h3>
      <span class="queue-count">{{ itemsProcessed }}/{{ items.length }}</span>
    </div>

    <div class="queue-list">
      <div v-for="item in items" :key="item.id" class="queue-item" :class="`status-${item.status}`">
        <div class="item-header">
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div v-if="item.originalDimensions" class="item-dimensions">
              {{ item.originalDimensions.width }}×{{ item.originalDimensions.height }}px
              <span v-if="scale !== 100" class="arrow">→</span>
              <span v-if="scale !== 100" class="final-dimensions">
                {{ Math.round(item.originalDimensions.width * scale / 100) }}×{{ Math.round(item.originalDimensions.height * scale / 100) }}px
              </span>
            </div>
            <div class="item-status">
              <span v-if="item.status === 'queued'" class="badge queued">Na fila</span>
              <span v-else-if="item.status === 'processing'" class="badge processing">
                <i class="fa-solid fa-spinner"></i> Processando
              </span>
              <span v-else-if="item.status === 'done'" class="badge done">
                <i class="fa-solid fa-check"></i> Pronto
              </span>
              <span v-else-if="item.status === 'error'" class="badge error">
                <i class="fa-solid fa-exclamation"></i> Erro
              </span>
            </div>
          </div>
          <div v-if="item.resultSize" class="item-size">{{ formatFileSize(item.resultSize) }}</div>
        </div>

        <ProgressBar v-if="item.status === 'processing'" :progress="item.progress" />
        <div v-else-if="item.status === 'error'" class="error-message">{{ item.error }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import ProgressBar from './ProgressBar.vue'
import { formatFileSize } from '@/utils/file'
import type { BatchItem } from '@/types/batch'

export default defineComponent({
  name: 'BatchQueueList',
  components: {
    ProgressBar
  },
  props: {
    items: {
      type: Array as PropType<BatchItem[]>,
      required: true
    },
    scale: {
      type: Number,
      default: 100
    }
  },
  computed: {
    itemsProcessed(): number {
      return this.items.filter(item => item.status === 'done' || item.status === 'error').length
    }
  },
  methods: {
    formatFileSize
  }
})
</script>

<style scoped>
.batch-queue {
  margin: 20px 0;
  background: rgba(138, 180, 248, 0.05);
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(138, 180, 248, 0.15);
}

.queue-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 10px;
}

.queue-header i {
  color: var(--accent-color);
}

.queue-count {
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.6;
  background: rgba(138, 180, 248, 0.1);
  padding: 4px 12px;
  border-radius: 6px;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 520px;
  overflow-y: auto;
}

.queue-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
}

.queue-item.status-done {
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.05);
}

.queue-item.status-error {
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.05);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
  word-break: break-word;
  margin-bottom: 4px;
}

.item-dimensions {
  font-size: 0.8rem;
  color: var(--text-color);
  opacity: 0.65;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-dimensions .arrow {
  color: var(--accent-color);
  opacity: 0.8;
}

.item-dimensions .final-dimensions {
  color: var(--accent-color);
  font-weight: 500;
  opacity: 0.9;
}

.item-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge {
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.badge.queued {
  background: rgba(107, 114, 128, 0.2);
  color: rgba(107, 114, 128, 0.8);
}

.badge.processing {
  background: rgba(59, 130, 246, 0.2);
  color: var(--accent-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge.processing i {
  animation: spin 1s linear infinite;
}

.badge.done {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge.error {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-size {
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.6;
  margin-left: 12px;
}

.error-message {
  font-size: 0.8rem;
  color: #f87171;
  padding: 6px 8px;
  background: rgba(248, 113, 113, 0.1);
  border-radius: 4px;
  border-left: 2px solid #f87171;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.queue-list::-webkit-scrollbar {
  width: 6px;
}

.queue-list::-webkit-scrollbar-track {
  background: rgba(138, 180, 248, 0.05);
  border-radius: 3px;
}

.queue-list::-webkit-scrollbar-thumb {
  background: rgba(138, 180, 248, 0.2);
  border-radius: 3px;
}

.queue-list::-webkit-scrollbar-thumb:hover {
  background: rgba(138, 180, 248, 0.3);
}
</style>
