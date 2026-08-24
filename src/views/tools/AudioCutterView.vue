<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-scissors"></i> Cortador de Áudio</h1>
      <p>Corte trechos de arquivos de áudio diretamente no seu navegador</p>
    </div>

    <div class="tool-content">
      <div class="upload-section" v-if="!audioBuffer">
        <FileDropZone
          accept="audio/*"
          label="Clique ou arraste um arquivo de áudio"
          hint="MP3, WAV, OGG, etc."
          icon="fa-cloud-arrow-up"
          @file-selected="handleAudioUpload"
        />
      </div>

      <div class="editor-area" v-if="audioBuffer">
        <div class="waveform-section">
          <div class="waveform-wrapper"
            @mousemove="onWaveformMouseMove"
            @mouseleave="hideCursorLine"
            @click="onWaveformClick">
            <canvas
              ref="waveformCanvas"
              class="waveform-canvas"
              width="800"
              height="150"
            ></canvas>

            <!-- Cursor line (where mouse is) -->
            <div class="cursor-line" ref="cursorLine" v-if="showCursorLine">
              <span class="cursor-time">{{ cursorTime }}</span>
            </div>

            <!-- Click marker (shows where user clicked) -->
            <div
              v-if="clickedTime !== null"
              class="click-marker"
              :style="{ left: getMarkerPosition(clickedTime) }"
            >
              <span class="click-marker-time">{{ formatTime(clickedTime) }}</span>
            </div>

            <!-- Start marker (draggable) -->
            <div
              v-if="startTime > 0"
              class="marker start-marker"
              :style="{ left: getMarkerPosition(startTime) }"
              @mousedown.stop="startDragMarker('start', $event)"
              title="Drag para ajustar início"
            >
              <i class="fa-solid fa-flag"></i>
            </div>

            <!-- End marker (draggable) -->
            <div
              v-if="endTime < totalDuration"
              class="marker end-marker"
              :style="{ left: getMarkerPosition(endTime) }"
              @mousedown.stop="startDragMarker('end', $event)"
              title="Drag para ajustar fim"
            >
              <i class="fa-solid fa-flag"></i>
            </div>

            <!-- Playhead (play indicator) -->
            <div class="playhead" ref="playhead" v-if="isPlaying"></div>

            <!-- Selection highlight -->
            <div
              v-if="startTime > 0 || endTime < totalDuration"
              class="selection-highlight"
              :style="{
                left: getMarkerPosition(startTime),
                right: (100 - getMarkerPercentage(endTime)) + '%'
              }"
            ></div>
          </div>

          <div class="time-display">
            <span>{{ currentTime }}</span>
            <span>{{ totalTime }}</span>
          </div>
        </div>

        <div class="controls-section">
          <button @click="togglePlayback" class="btn btn-primary">
            <i :class="isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
            {{ isPlaying ? 'Pausar' : 'Reproduzir' }}
          </button>

          <button @click="markStart" :class="['btn', 'btn-secondary', { marked: startTime > 0 }]">
            <i class="fa-solid fa-flag"></i> Início: {{ formatTime(startTime) }}
          </button>

          <button @click="markEnd" :class="['btn', 'btn-secondary', { marked: endTime < totalDuration }]">
            <i class="fa-solid fa-flag"></i> Fim: {{ formatTime(endTime) }}
          </button>

          <button @click="previewCut" :disabled="!canCut" class="btn btn-secondary">
            <i class="fa-solid fa-eye"></i> Prévia
          </button>

          <button @click="cutAudio" :disabled="!canCut" class="btn btn-primary">
            <i class="fa-solid fa-scissors"></i> Cortar e Baixar
          </button>

          <button @click="resetState" class="btn btn-secondary">
            <i class="fa-solid fa-arrow-rotate-left"></i> Novo Áudio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import FileDropZone from '@/components/common/FileDropZone.vue'
import { formatTime, bufferToWave } from '@/utils/audio'

export default defineComponent({
  name: 'AudioCutterView',
  components: {
    FileDropZone
  },
  data() {
    return {
      audioContext: null as AudioContext | null,
      audioBuffer: null as AudioBuffer | null,
      sourceNode: null as AudioBufferAudioNode | null,
      startTime: 0,
      endTime: 0,
      currentTime: '00:00',
      totalTime: '00:00',
      totalDuration: 0,
      isPlaying: false,
      playbackStartTime: 0,
      startOffset: 0,
      animationFrameId: null as number | null,
      showCursorLine: false,
      cursorTime: '00:00',
      cursorPercent: 0,
      draggingMarker: null as 'start' | 'end' | null,
      canvasWidth: 800,
      clickedTime: null as number | null
    }
  },
  computed: {
    canCut(): boolean {
      return this.endTime > this.startTime && this.endTime - this.startTime > 0.1
    }
  },
  methods: {
    formatTime,

    async handleAudioUpload(file: File) {
      if (!file.type.startsWith('audio/')) {
        this.$message.error('Por favor, selecione um arquivo de áudio válido')
        return
      }

      if (this.isPlaying) this.stopAudio()
      if (this.audioContext) this.audioContext.close()

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await file.arrayBuffer()
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.totalDuration = this.audioBuffer.duration
      this.endTime = this.totalDuration
      this.totalTime = formatTime(this.totalDuration)

      await this.$nextTick()
      this.drawWaveform()
    },

    drawWaveform() {
      if (!this.audioBuffer) return

      const canvas = this.$refs.waveformCanvas as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const data = this.audioBuffer.getChannelData(0)
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      const startPixel = (this.startTime / this.audioBuffer.duration) * width
      const endPixel = (this.endTime / this.audioBuffer.duration) * width

      const step = Math.ceil(data.length / width)
      const amp = height / 2

      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'

      for (let i = 0; i < width; i++) {
        let min = 1.0
        let max = -1.0
        for (let j = 0; j < step; j++) {
          const datum = data[i * step + j]
          if (datum < min) min = datum
          if (datum > max) max = datum
        }

        if (i >= startPixel && i <= endPixel) {
          ctx.strokeStyle = '#a8c0ff'
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        }

        ctx.beginPath()
        ctx.moveTo(i, amp + amp * min)
        ctx.lineTo(i, amp + amp * max)
        ctx.stroke()
      }
    },

    togglePlayback() {
      if (this.isPlaying) {
        this.stopAudio()
      } else {
        this.playAudio(this.startOffset, this.audioBuffer!.duration - this.startOffset)
      }
    },

    playAudio(start: number, duration: number) {
      if (this.isPlaying) this.stopAudio()

      if (!this.audioContext || !this.audioBuffer) return

      this.clickedTime = null
      this.sourceNode = this.audioContext.createBufferSource()
      this.sourceNode.buffer = this.audioBuffer
      this.sourceNode.connect(this.audioContext.destination)

      this.playbackStartTime = this.audioContext.currentTime
      this.startOffset = start

      this.sourceNode.start(0, start, duration)
      this.isPlaying = true

      this.sourceNode.onended = () => {
        this.isPlaying = false
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
      }

      this.updatePlayhead()
    },

    stopAudio() {
      if (this.sourceNode) {
        this.sourceNode.onended = null
        this.sourceNode.stop()
        this.sourceNode.disconnect()
        this.sourceNode = null
      }
      this.startOffset += this.audioContext!.currentTime - this.playbackStartTime
      this.isPlaying = false
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
    },

    updatePlayhead() {
      if (!this.isPlaying || !this.audioContext) return

      const elapsedTime = this.audioContext.currentTime - this.playbackStartTime
      const currentPlaybackTime = this.startOffset + elapsedTime
      const percent = (currentPlaybackTime / this.totalDuration) * 100

      const playhead = this.$refs.playhead as HTMLElement | undefined
      if (playhead) {
        playhead.style.left = `${percent}%`
      }
      this.currentTime = formatTime(currentPlaybackTime)

      this.animationFrameId = requestAnimationFrame(() => this.updatePlayhead())
    },

    onWaveformClick(event: MouseEvent) {
      if (!this.audioBuffer) return

      const wrapper = event.currentTarget as HTMLElement
      const rect = wrapper.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const percent = clickX / rect.width
      const newTime = percent * this.audioBuffer.duration

      this.clickedTime = newTime
      this.startOffset = newTime
      const playhead = this.$refs.playhead as HTMLElement | undefined
      if (playhead) {
        playhead.style.left = `${percent * 100}%`
      }
      this.currentTime = formatTime(newTime)

      if (this.isPlaying) {
        this.playAudio(newTime, this.audioBuffer.duration - newTime)
      }
    },

    markStart() {
      this.startTime = this.isPlaying
        ? this.startOffset + (this.audioContext!.currentTime - this.playbackStartTime)
        : this.startOffset
      this.clickedTime = null
      this.drawWaveform()
    },

    markEnd() {
      const currentTime = this.isPlaying
        ? this.startOffset + (this.audioContext!.currentTime - this.playbackStartTime)
        : this.startOffset

      if (currentTime <= this.startTime) {
        this.$message.error('O tempo final deve ser maior que o tempo inicial')
        return
      }

      this.endTime = currentTime
      this.clickedTime = null
      this.drawWaveform()
    },

    previewCut() {
      if (!this.canCut) return
      this.playAudio(this.startTime, this.endTime - this.startTime)
    },

    async cutAudio() {
      if (!this.audioBuffer || !this.canCut) return

      const sampleRate = this.audioBuffer.sampleRate
      const startIndex = Math.floor(this.startTime * sampleRate)
      const endIndex = Math.floor(this.endTime * sampleRate)
      const newLength = endIndex - startIndex

      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const newBuffer = newAudioContext.createBuffer(
        this.audioBuffer.numberOfChannels,
        newLength,
        sampleRate
      )

      for (let i = 0; i < this.audioBuffer.numberOfChannels; i++) {
        newBuffer.copyToChannel(
          this.audioBuffer.getChannelData(i).slice(startIndex, endIndex),
          i
        )
      }

      const wavBlob = bufferToWave(newBuffer)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(wavBlob)
      link.download = 'audio-cortado.wav'
      link.click()
      URL.revokeObjectURL(link.href)

      this.$message.success('Áudio baixado com sucesso!')
    },

    resetState() {
      if (this.isPlaying) this.stopAudio()
      if (this.audioContext) this.audioContext.close()

      this.audioBuffer = null
      this.audioContext = null
      this.startTime = 0
      this.endTime = 0
      this.currentTime = '00:00'
      this.totalTime = '00:00'
      this.startOffset = 0
    },

    getMarkerPosition(time: number): string {
      const percent = (time / this.totalDuration) * 100
      return `${percent}%`
    },

    getMarkerPercentage(time: number): number {
      return (time / this.totalDuration) * 100
    },

    onWaveformMouseMove(event: MouseEvent) {
      if (!this.audioBuffer) return

      const canvas = event.currentTarget as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const percent = mouseX / rect.width
      this.cursorPercent = percent * 100
      this.cursorTime = formatTime(percent * this.totalDuration)
      this.showCursorLine = true

      const cursorLine = this.$refs.cursorLine as HTMLElement
      if (cursorLine) {
        cursorLine.style.left = `${this.cursorPercent}%`
      }
    },

    hideCursorLine() {
      this.showCursorLine = false
    },

    startDragMarker(markerType: 'start' | 'end', event: MouseEvent) {
      if (!this.audioBuffer) return

      this.draggingMarker = markerType
      const canvas = this.$refs.waveformCanvas as HTMLCanvasElement

      const onMouseMove = (moveEvent: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        const mouseX = moveEvent.clientX - rect.left
        const percent = Math.max(0, Math.min(1, mouseX / rect.width))
        const newTime = percent * this.totalDuration

        if (markerType === 'start') {
          if (newTime < this.endTime) {
            this.startTime = newTime
          }
        } else {
          if (newTime > this.startTime) {
            this.endTime = newTime
          }
        }

        this.drawWaveform()
      }

      const onMouseUp = () => {
        this.draggingMarker = null
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }
  },

  beforeUnmount() {
    if (this.isPlaying) this.stopAudio()
    if (this.audioContext) this.audioContext.close()
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
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
  max-width: 700px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 30px;
}

.editor-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.waveform-section {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 20px;
  position: relative;
}

.waveform-wrapper {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
}

.waveform-canvas {
  display: block;
  width: 100%;
  height: 150px;
  border-radius: 8px;
}

/* Cursor line - vertical indicator where mouse is */
.cursor-line {
  position: absolute;
  top: 0;
  width: 1px;
  height: 150px;
  background: linear-gradient(to bottom, var(--accent-color), transparent);
  pointer-events: none;
  z-index: 2;
}

.cursor-time {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent-color);
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Markers for start/end points */
.marker {
  position: absolute;
  top: 0;
  width: 3px;
  height: 150px;
  cursor: ew-resize;
  z-index: 3;
  transition: all 0.15s;
}

.marker i {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1rem;
  color: var(--accent-color);
  background: var(--container-bg);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--accent-color);
}

.start-marker {
  background: rgba(138, 180, 248, 0.6);
  left: 0;
}

.start-marker:hover {
  background: rgba(138, 180, 248, 0.9);
}

.end-marker {
  background: rgba(240, 120, 120, 0.6);
  right: 0;
}

.end-marker:hover {
  background: rgba(240, 120, 120, 0.9);
}

/* Selection highlight - area between start and end */
.selection-highlight {
  position: absolute;
  top: 0;
  height: 150px;
  background: linear-gradient(to right, rgba(138, 180, 248, 0.15), rgba(240, 120, 120, 0.15));
  pointer-events: none;
  z-index: 1;
  border-radius: 8px;
}

.playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 150px;
  background: #fff;
  left: 0;
  opacity: 1;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  pointer-events: none;
  z-index: 4;
}

/* Click marker - shows where user clicked */
.click-marker {
  position: absolute;
  top: 0;
  width: 3px;
  height: 150px;
  background: linear-gradient(to bottom, rgba(255, 200, 0, 0.8), rgba(255, 200, 0, 0.3));
  pointer-events: none;
  z-index: 2;
}

.click-marker-time {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 200, 0, 0.9);
  color: #000;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid rgba(255, 200, 0, 0.6);
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 0.85rem;
  opacity: 0.7;
  font-family: 'Monaco', 'Courier New', monospace;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
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

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-color);
}

.btn-secondary.marked {
  border-color: var(--accent-color);
  background: rgba(138, 180, 248, 0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
