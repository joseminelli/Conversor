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
          <canvas
            ref="waveformCanvas"
            :key="`waveform-${Date.now()}`"
            class="waveform-canvas"
            width="800"
            height="150"
            @click="onWaveformClick"
          ></canvas>
          <div class="playhead" ref="playhead"></div>
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
      animationFrameId: null as number | null
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

      const playhead = this.$refs.playhead as HTMLElement
      playhead.style.left = `${percent}%`
      this.currentTime = formatTime(currentPlaybackTime)

      this.animationFrameId = requestAnimationFrame(() => this.updatePlayhead())
    },

    onWaveformClick(event: MouseEvent) {
      if (!this.audioBuffer) return

      const canvas = event.currentTarget as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const percent = clickX / rect.width
      const newTime = percent * this.audioBuffer.duration

      this.startOffset = newTime
      const playhead = this.$refs.playhead as HTMLElement
      playhead.style.left = `${percent * 100}%`
      this.currentTime = formatTime(newTime)

      if (this.isPlaying) {
        this.playAudio(newTime, this.audioBuffer.duration - newTime)
      }
    },

    markStart() {
      this.startTime = this.isPlaying
        ? this.startOffset + (this.audioContext!.currentTime - this.playbackStartTime)
        : this.startOffset
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

.waveform-canvas {
  display: block;
  width: 100%;
  height: 150px;
  border-radius: 8px;
  cursor: crosshair;
  background: rgba(0, 0, 0, 0.3);
}

.playhead {
  position: absolute;
  top: 20px;
  width: 2px;
  height: 150px;
  background: var(--accent-color);
  left: 0;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
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
