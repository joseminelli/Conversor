<template>
  <div class="progress-bar-container">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
    </div>
    <span class="progress-text">{{ progress }}%</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ProgressBar',
  props: {
    progress: {
      type: Number,
      required: true,
      validator: (v: number) => v >= 0 && v <= 100
    }
  }
})
</script>

<style scoped>
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(138, 180, 248, 0.15);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(138, 180, 248, 0.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), #c58af9);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.7;
  min-width: 40px;
  text-align: right;
}
</style>
