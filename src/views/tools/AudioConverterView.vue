<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-sliders"></i> Conversor de Áudio</h1>
      <p>Altere o formato (MP3, WAV) e ajuste o volume dos seus arquivos de áudio</p>
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
            :key="`converter-waveform-${Date.now()}`"
            class="waveform-canvas"
            width="800"
            height="150"
          ></canvas>
        </div>

        <div class="controls-section">
          <LabeledSlider
            id="volume-slider"
            label="Volume"
            v-model="volume"
            :min="0"
            :max="200"
            suffix="%"
            @update:modelValue="updateWaveform"
          />

          <div class="control-group">
            <label for="format-select">Formato de saída:</label>
            <select
              id="format-select"
              v-model="format"
              class="select-field"
              @change="onFormatChange"
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
            </select>
          </div>

          <div class="control-group" v-if="format === 'mp3'">
            <label for="bitrate-select">Taxa de bits (MP3):</label>
            <select id="bitrate-select" v-model.number="bitrate" class="select-field">
              <option value="128">128 kbps</option>
              <option value="192">192 kbps</option>
              <option value="256">256 kbps</option>
              <option value="320">320 kbps</option>
            </select>
          </div>

          <button @click="processAudio" class="btn btn-primary">
            <i class="fa-solid fa-cogs"></i> Processar e Baixar
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
import LabeledSlider from '@/components/common/LabeledSlider.vue'
import { bufferToWave, encodeToMp3 } from '@/utils/audio'

export default defineComponent({
  name: 'AudioConverterView',
  components: {
    FileDropZone,
    LabeledSlider
  },
  data() {
    return {
      audioContext: null as AudioContext | null,
      audioBuffer: null as AudioBuffer | null,
      originalFileName: '',
      volume: 100,
      format: 'wav' as 'wav' | 'mp3',
      bitrate: 192,
      isProcessing: false
    }
  },
  methods: {
    async handleAudioUpload(file: File) {
      if (!file.type.startsWith('audio/')) {
        this.$message.error('Por favor, selecione um arquivo de áudio válido')
        return
      }

      this.originalFileName = file.name
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await file.arrayBuffer()
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.volume = 100
      await this.$nextTick()
      this.updateWaveform()
    },

    updateWaveform() {
      if (!this.audioBuffer) return

      const canvas = this.$refs.waveformCanvas as HTMLCanvasElement
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let data = this.audioBuffer.getChannelData(0)

      if (this.volume !== 100) {
        const modifiedData = new Float32Array(data.length)
        const volumeFactor = this.volume / 100
        for (let i = 0; i < data.length; i++) {
          modifiedData[i] = data[i] * volumeFactor
        }
        data = modifiedData
      }

      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

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

        ctx.beginPath()
        ctx.moveTo(i, amp + amp * min)
        ctx.lineTo(i, amp + amp * max)
        ctx.stroke()
      }
    },

    onFormatChange() {
      // Reset bitrate when format changes
      if (this.format === 'wav') {
        this.bitrate = 192
      }
    },

    async processAudio() {
      if (!this.audioBuffer) return

      this.isProcessing = true

      try {
        const offlineContext = new OfflineAudioContext(
          this.audioBuffer.numberOfChannels,
          this.audioBuffer.length,
          this.audioBuffer.sampleRate
        )

        const source = offlineContext.createBufferSource()
        source.buffer = this.audioBuffer

        const gainNode = offlineContext.createGain()
        gainNode.gain.value = this.volume / 100

        source.connect(gainNode)
        gainNode.connect(offlineContext.destination)
        source.start()

        const processedBuffer = await offlineContext.startRendering()

        let blob: Blob | null = null

        if (this.format === 'mp3') {
          blob = encodeToMp3(processedBuffer, this.bitrate)
        } else {
          blob = bufferToWave(processedBuffer)
        }

        if (blob) {
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          const baseName = this.originalFileName.replace(/\.[^/.]+$/, '')
          link.download = `${baseName}_convertido.${this.format}`
          link.click()
          URL.revokeObjectURL(link.href)

          this.$message.success(`Áudio convertido para ${this.format.toUpperCase()}!`)
        }
      } catch (error) {
        console.error('Erro ao processar áudio:', error)
        this.$message.error('Erro ao processar o áudio')
      } finally {
        this.isProcessing = false
      }
    },

    resetState() {
      if (this.audioContext) this.audioContext.close()
      this.audioBuffer = null
      this.audioContext = null
      this.originalFileName = ''
      this.volume = 100
      this.format = 'wav'
      this.bitrate = 192
    }
  },

  beforeUnmount() {
    if (this.audioContext) this.audioContext.close()
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
  max-width: 600px;
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
}

.waveform-canvas {
  display: block;
  width: 100%;
  height: 150px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-color);
}

.select-field {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.95rem;
  cursor: pointer;
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

.btn-primary:hover:not(:disabled) {
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
