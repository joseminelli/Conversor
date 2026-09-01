<template>
  <div class="before-after-container">
    <div class="comparison-wrapper" ref="wrapper" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
      <!-- Before Image -->
      <div class="before-image">
        <img
          :src="beforeSrc"
          :alt="beforeLabel"
          :style="{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)` }"
          :class="{ dragging: isPanning }"
          @mousedown="startPan"
        />
        <span v-if="sliderPosition < 60" class="label before-label">
          {{ beforeLabel }}
        </span>
      </div>

      <!-- After Image (clipped) -->
      <div
        ref="afterImageDiv"
        class="after-image"
      >
        <img
          :src="afterSrc"
          :alt="afterLabel"
          :style="{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)` }"
          :class="{ dragging: isPanning }"
          @mousedown="startPan"
        />
      </div>

      <!-- After Label (outside clip-path) -->
      <span v-if="sliderPosition > 40" class="label after-label">
        {{ afterLabel }}
      </span>

      <!-- Slider Handle -->
      <div
        ref="sliderHandle"
        class="slider-handle"
      >
        <div class="slider-line"></div>
        <div class="slider-arrows">
          <i class="fa-solid fa-chevron-left"></i>
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <div class="zoom-controls">
        <button
          v-for="z in [1, 2, 3]"
          :key="z"
          :class="['zoom-btn', { active: zoom === z }]"
          @click="setZoom(z)"
        >
          {{ z }}×
        </button>
      </div>

      <div class="info-text">
        <span v-if="zoom > 1" class="pan-hint">
          <i class="fa-solid fa-hand"></i> Arraste para mover
        </span>
        <span v-else class="drag-hint">
          <i class="fa-solid fa-arrows-left-right"></i> Arraste o divisor
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BeforeAfterSlider',
  props: {
    beforeSrc: {
      type: String,
      required: true
    },
    afterSrc: {
      type: String,
      required: true
    },
    beforeLabel: {
      type: String,
      default: 'Original'
    },
    afterLabel: {
      type: String,
      default: 'Resultado'
    }
  },
  data() {
    return {
      sliderPosition: 50,
      isDragging: false,
      zoom: 1,
      isPanning: false,
      panX: 0,
      panY: 0,
      panStartX: 0,
      panStartY: 0,
      panStartPanX: 0,
      panStartPanY: 0,
      boundHandleDrag: null as any,
      boundStopDragging: null as any,
      boundStopPan: null as any
    }
  },
  mounted() {
    this.boundHandleDrag = this.handleDrag.bind(this)
    this.boundStopDragging = this.stopDragging.bind(this)
    this.boundStopPan = this.stopPan.bind(this)

    const sliderHandle = this.$refs.sliderHandle as HTMLElement | undefined
    const afterImage = this.$refs.afterImageDiv as HTMLElement | undefined

    if (sliderHandle) {
      sliderHandle.addEventListener('mousedown', this.startDragging.bind(this))
      sliderHandle.style.setProperty('--slider-position', '50%')
    }

    if (afterImage) {
      afterImage.style.setProperty('--clip-amount', '50%')
    }

    document.addEventListener('mousemove', this.boundHandleDrag)
    document.addEventListener('mouseup', this.boundStopDragging)
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.boundHandleDrag)
    document.removeEventListener('mouseup', this.boundStopDragging)
    document.removeEventListener('mouseup', this.boundStopPan)
  },
  methods: {
    startDragging(e: MouseEvent) {
      this.isDragging = true
      e.preventDefault()
    },
    handleDrag(event: MouseEvent) {
      if (!this.isDragging) return

      const wrapper = this.$refs.wrapper as HTMLElement | undefined
      const handle = this.$refs.sliderHandle as HTMLElement | undefined
      const afterImage = this.$refs.afterImageDiv as HTMLElement | undefined
      if (!wrapper || !handle || !afterImage) return

      const rect = wrapper.getBoundingClientRect()
      const x = event.clientX - rect.left
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100))

      this.sliderPosition = position
      handle.style.setProperty('--slider-position', `${position}%`)
      afterImage.style.setProperty('--clip-amount', `${100 - position}%`)
    },
    stopDragging() {
      this.isDragging = false
    },
    startPan(event: MouseEvent) {
      if (this.zoom <= 1) return
      event.preventDefault()
      this.isPanning = true
      this.panStartX = event.clientX
      this.panStartY = event.clientY
      this.panStartPanX = this.panX
      this.panStartPanY = this.panY
      document.addEventListener('mouseup', this.boundStopPan)
    },
    stopPan() {
      this.isPanning = false
      document.removeEventListener('mouseup', this.boundStopPan)
    },
    handleMouseMove(event: MouseEvent) {
      if (!this.isPanning || this.zoom <= 1) return

      const deltaX = event.clientX - this.panStartX
      const deltaY = event.clientY - this.panStartY

      const wrapper = this.$refs.wrapper as HTMLElement | undefined
      if (!wrapper) return

      const maxPan = wrapper.clientWidth / 4
      this.panX = Math.max(-maxPan, Math.min(maxPan, this.panStartPanX + deltaX))
      this.panY = Math.max(-maxPan, Math.min(maxPan, this.panStartPanY + deltaY))
    },
    handleMouseLeave() {
      if (this.isPanning) {
        this.isPanning = false
        document.removeEventListener('mouseup', this.stopPan)
      }
    },
    setZoom(z: number) {
      this.zoom = z
      if (z === 1) {
        this.panX = 0
        this.panY = 0
      }
    }
  }
})
</script>

<style scoped>
.before-after-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.comparison-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--input-bg);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(138, 180, 248, 0.2);
  cursor: ew-resize;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -webkit-user-drag: none;
}

.before-image,
.after-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
}

.before-image img,
.after-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -webkit-user-drag: none;
  -khtml-user-select: none;
  -ms-user-select: none;
  pointer-events: auto;
  cursor: grab;
  transition: cursor 0.2s;
  display: block;
}

.before-image img.dragging,
.after-image img.dragging {
  cursor: grabbing;
}

.after-image {
  clip-path: inset(0 var(--clip-amount, 50%) 0 0);
  will-change: clip-path;
}

.label {
  position: absolute;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 6px;
  backdrop-filter: blur(10px);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  pointer-events: none;
  -webkit-user-drag: none;
}

.before-label {
  bottom: 12px;
  left: 12px;
  position: absolute;
  z-index: 11;
}

.after-label {
  bottom: 12px;
  right: 12px;
  position: absolute;
  z-index: 11;
}

.slider-handle {
  position: absolute;
  top: 0;
  height: 100%;
  width: 40px;
  background: transparent;
  cursor: ew-resize;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -webkit-user-drag: none;
  margin-left: -20px;
  left: var(--slider-position, 50%);
}

.comparison-wrapper:hover .slider-handle {
  width: 50px;
  margin-left: -25px;
}

.slider-line {
  position: absolute;
  width: 3px;
  height: 100%;
  background: var(--accent-color);
  box-shadow: 0 0 8px rgba(138, 180, 248, 0.5);
  will-change: transform;
}

.slider-arrows {
  position: absolute;
  display: flex;
  gap: 4px;
  color: white;
  font-size: 0.8rem;
  background: var(--accent-color);
  padding: 8px 10px;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(138, 180, 248, 0.4);
  transition: all 0.2s ease;
}

.comparison-wrapper:hover .slider-arrows {
  box-shadow: 0 6px 16px rgba(138, 180, 248, 0.6);
  padding: 8px 12px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  background: rgba(138, 180, 248, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(138, 180, 248, 0.15);
}

.zoom-controls {
  display: flex;
  gap: 8px;
}

.zoom-btn {
  padding: 6px 14px;
  background: rgba(138, 180, 248, 0.1);
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 6px;
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-btn:hover {
  background: rgba(138, 180, 248, 0.15);
  border-color: var(--accent-color);
}

.zoom-btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.7;
}

.info-text i {
  color: var(--accent-color);
}

@media (max-width: 768px) {
  .comparison-wrapper {
    aspect-ratio: 4 / 3;
  }

  .label {
    font-size: 0.75rem;
    padding: 4px 8px;
  }

  .slider-arrows {
    font-size: 0.65rem;
    padding: 4px 6px;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .zoom-controls {
    width: 100%;
    justify-content: center;
  }

  .info-text {
    justify-content: center;
  }
}
</style>
