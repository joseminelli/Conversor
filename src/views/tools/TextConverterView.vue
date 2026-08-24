<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-language"></i> Conversor de Texto</h1>
      <p>Converta textos entre diferentes bases e formatos</p>
    </div>

    <div class="tool-content">
      <div class="input-section">
        <div class="control-group">
          <label for="input-text">Texto de Entrada:</label>
          <textarea
            id="input-text"
            v-model="inputText"
            placeholder="Digite ou cole o texto aqui"
            class="textarea-field"
            @input="convertText"
          ></textarea>
        </div>

        <div class="control-group">
          <label for="input-format">Formato de Entrada:</label>
          <select id="input-format" v-model="inputFormat" class="select-field" @change="convertText">
            <option value="text">Texto Normal</option>
            <option value="binary">Binário</option>
            <option value="hex">Hexadecimal</option>
            <option value="base64">Base64</option>
            <option value="ascii">ASCII</option>
          </select>
        </div>

        <div class="control-group">
          <label for="output-format">Formato de Saída:</label>
          <select id="output-format" v-model="outputFormat" class="select-field" @change="convertText">
            <option value="text">Texto Normal</option>
            <option value="binary">Binário</option>
            <option value="hex">Hexadecimal</option>
            <option value="base64">Base64</option>
            <option value="ascii">ASCII</option>
          </select>
        </div>
      </div>

      <div class="results-section" v-if="outputText">
        <div class="result-item">
          <div class="result-header">
            <h3>Resultado</h3>
            <button @click="copyToClipboard" class="copy-btn" title="Copiar resultado">
              <i class="fa-solid fa-copy"></i> Copiar
            </button>
          </div>
          <div class="result-output">
            {{ outputText }}
          </div>
          <div class="result-info">
            <span>{{ outputText.length }} caracteres</span>
            <span v-if="byteSize">{{ byteSize }} bytes</span>
          </div>
        </div>
      </div>

      <div class="action-buttons" v-if="inputText">
        <button @click="resetState" class="btn btn-secondary">
          <i class="fa-solid fa-arrow-rotate-left"></i> Limpar
        </button>
      </div>

      <div class="info-section">
        <div class="info-card">
          <h4><i class="fa-solid fa-circle-info"></i> Informações</h4>
          <ul>
            <li><strong>Texto Normal:</strong> Formato legível comum</li>
            <li><strong>Binário:</strong> Representação em bits (0 e 1)</li>
            <li><strong>Hexadecimal:</strong> Base 16 (0-9, A-F)</li>
            <li><strong>Base64:</strong> Codificação de dados binários em ASCII</li>
            <li><strong>ASCII:</strong> Códigos numéricos dos caracteres</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TextConverterView',
  data() {
    return {
      inputText: '',
      outputText: '',
      inputFormat: 'text' as 'text' | 'binary' | 'hex' | 'base64' | 'ascii',
      outputFormat: 'binary' as 'text' | 'binary' | 'hex' | 'base64' | 'ascii',
      byteSize: ''
    }
  },
  methods: {
    convertText() {
      if (!this.inputText) {
        this.outputText = ''
        this.byteSize = ''
        return
      }

      try {
        let decoded = this.decodeFromFormat(this.inputText, this.inputFormat)
        this.outputText = this.encodeToFormat(decoded, this.outputFormat)
        this.calculateByteSize()
      } catch (error) {
        this.outputText = 'Erro na conversão. Verifique o formato de entrada.'
        this.byteSize = ''
      }
    },

    decodeFromFormat(text: string, format: string): string {
      switch (format) {
        case 'text':
          return text
        case 'binary':
          return text
            .split(' ')
            .filter((b) => b.length > 0)
            .map((b) => String.fromCharCode(parseInt(b, 2)))
            .join('')
        case 'hex':
          return text
            .replace(/\s/g, '')
            .match(/.{1,2}/g)
            ?.map((hex) => String.fromCharCode(parseInt(hex, 16)))
            .join('') || ''
        case 'base64':
          return atob(text)
        case 'ascii':
          return text
            .split(',')
            .map((code) => String.fromCharCode(parseInt(code.trim())))
            .join('')
        default:
          return text
      }
    },

    encodeToFormat(text: string, format: string): string {
      switch (format) {
        case 'text':
          return text
        case 'binary':
          return Array.from(text)
            .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join(' ')
        case 'hex':
          return Array.from(text)
            .map((char) => char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
            .join(' ')
        case 'base64':
          return btoa(text)
        case 'ascii':
          return Array.from(text)
            .map((char) => char.charCodeAt(0))
            .join(', ')
        default:
          return text
      }
    },

    calculateByteSize() {
      try {
        const bytes = new TextEncoder().encode(this.outputText)
        this.byteSize = `${bytes.length}`
      } catch {
        this.byteSize = ''
      }
    },

    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.outputText)
        ;(this as any).$message.success('Resultado copiado!')
      } catch {
        ;(this as any).$message.error('Erro ao copiar')
      }
    },

    resetState() {
      this.inputText = ''
      this.outputText = ''
      this.byteSize = ''
    }
  }
})
</script>

<style scoped>
.input-section {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
}

.textarea-field {
  width: 100%;
  min-height: 150px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(138, 180, 248, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.95rem;
  font-family: 'Monaco', 'Courier New', monospace;
  resize: vertical;
  transition: all 0.3s ease;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.textarea-field:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 20px rgba(138, 180, 248, 0.2);
}

.results-section {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.result-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.copy-btn {
  padding: 8px 16px;
  background: rgba(138, 180, 248, 0.1);
  border: 1px solid rgba(138, 180, 248, 0.3);
  color: var(--accent-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-btn:hover {
  background: rgba(138, 180, 248, 0.15);
  border-color: var(--accent-color);
}

.result-output {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 10px;
  padding: 16px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  color: #a8c0ff;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.6;
}

.result-info {
  display: flex;
  gap: 20px;
  font-size: 0.85rem;
  opacity: 0.6;
  color: var(--text-color);
}

.info-section {
  margin-top: 40px;
}

.info-card {
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.15);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
}

.info-card h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-card h4 i {
  color: var(--accent-color);
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card li {
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.8;
  padding-left: 20px;
  position: relative;
}

.info-card li:before {
  content: '▸';
  position: absolute;
  left: 0;
  color: var(--accent-color);
}

.info-card strong {
  color: #fff;
}

@media (max-width: 768px) {
  .input-section,
  .results-section,
  .info-card {
    padding: 20px;
  }

  .textarea-field {
    min-height: 120px;
  }

  .result-output {
    max-height: 250px;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .copy-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
