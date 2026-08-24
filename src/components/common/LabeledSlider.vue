<template>
  <div class="control-group">
    <label :for="id" class="label">
      <span class="label-text">{{ label }}</span>
      <span class="label-value">{{ displayValue }}</span>
    </label>
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      class="slider"
      @input="$emit('update:modelValue', Number($event.target.value))"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LabeledSlider',
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    },
    suffix: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  computed: {
    displayValue(): string {
      return `${this.modelValue}${this.suffix}`
    }
  }
})
</script>

<style scoped>
.control-group {
  margin-bottom: 20px;
}

.label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  cursor: default;
}

.label-text {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.95rem;
}

.label-value {
  color: var(--accent-color);
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 50px;
  text-align: right;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(138, 180, 248, 0.4);
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(138, 180, 248, 0.6);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(138, 180, 248, 0.4);
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(138, 180, 248, 0.6);
}

.slider::-moz-range-track {
  background: transparent;
  border: none;
}
</style>
