<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-qrcode"></i> Gerador de QR Code</h1>
      <p>Crie QR codes customizáveis a partir de texto, URLs ou informações de contato</p>
    </div>

    <div class="tool-content">
      <div class="input-panel">
        <div class="type-selector">
          <button
            v-for="type in ['text', 'url', 'contact']"
            :key="type"
            @click="currentType = type"
            :class="['type-btn', { active: currentType === type }]"
          >
            {{ formatType(type) }}
          </button>
        </div>

        <div class="input-content">
          <div v-if="currentType === 'text'" id="text-input" class="input-type-content">
            <textarea
              v-model="textValue"
              placeholder="Digite o texto para o QR Code"
              class="input-field"
              rows="4"
            ></textarea>
          </div>

          <div v-if="currentType === 'url'" id="url-input" class="input-type-content">
            <input
              v-model="urlValue"
              type="url"
              placeholder="Digite a URL"
              class="input-field"
            />
          </div>

          <div v-if="currentType === 'contact'" id="contact-input" class="input-type-content">
            <input
              v-model="contactName"
              type="text"
              placeholder="Nome"
              class="input-field"
            />
            <input
              v-model="contactPhone"
              type="tel"
              placeholder="Telefone"
              class="input-field"
            />
            <input
              v-model="contactEmail"
              type="email"
              placeholder="Email"
              class="input-field"
            />
          </div>
        </div>

        <div class="settings-panel">
          <div class="setting-group">
            <label>Tamanho:</label>
            <div class="size-options">
              <label v-for="size in [200, 300, 400, 500]" :key="size">
                <input v-model.number="qrSize" type="radio" :value="size" />
                {{ size }}x{{ size }}
              </label>
            </div>
          </div>

          <div class="setting-group">
            <label for="qr-dark">Cor (escura):</label>
            <input id="qr-dark" v-model="darkColor" type="color" class="color-input" />
          </div>

          <div class="setting-group">
            <label for="qr-light">Fundo:</label>
            <input id="qr-light" v-model="lightColor" type="color" class="color-input" />
          </div>
        </div>

        <button @click="generateQRCode" class="btn btn-primary">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Gerar QR Code
        </button>
      </div>

      <div v-if="qrCodeDataUrl" class="preview-panel">
        <div class="qr-preview">
          <img :src="qrCodeDataUrl" alt="QR Code" />
        </div>

        <div class="download-buttons">
          <button @click="downloadQRCode('png')" class="btn btn-secondary">
            <i class="fa-solid fa-download"></i> Baixar PNG
          </button>
          <button @click="downloadQRCode('jpg')" class="btn btn-secondary">
            <i class="fa-solid fa-download"></i> Baixar JPEG
          </button>
          <button @click="copyToClipboard" class="btn btn-secondary">
            <i class="fa-solid fa-copy"></i> Copiar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import QRCode from 'qrcode'

export default defineComponent({
  name: 'QrCodeGeneratorView',
  data() {
    return {
      currentType: 'text' as 'text' | 'url' | 'contact',
      textValue: '',
      urlValue: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      qrSize: 300,
      darkColor: '#000000',
      lightColor: '#FFFFFF',
      qrCodeDataUrl: ''
    }
  },
  methods: {
    formatType(type: string): string {
      return type === 'text' ? 'Texto' : type === 'url' ? 'URL' : 'Contato'
    },

    getQRContent(): string {
      if (this.currentType === 'text') {
        return this.textValue.trim()
      } else if (this.currentType === 'url') {
        return this.urlValue.trim()
      } else {
        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n'
        if (this.contactName) vcard += `FN:${this.contactName}\n`
        if (this.contactPhone) vcard += `TEL:${this.contactPhone}\n`
        if (this.contactEmail) vcard += `EMAIL:${this.contactEmail}\n`
        vcard += 'END:VCARD'
        return vcard
      }
    },

    async generateQRCode() {
      const content = this.getQRContent()
      if (!content) {
        this.$message.error('Por favor, preencha o conteúdo do QR Code')
        return
      }

      try {
        const canvas = document.createElement('canvas')
        this.qrCodeDataUrl = await QRCode.toDataURL(canvas, content, {
          width: this.qrSize,
          color: {
            dark: this.darkColor,
            light: this.lightColor
          },
          errorCorrectionLevel: 'M'
        })
        this.$message.success('QR Code gerado com sucesso!')
      } catch (error) {
        console.error(error)
        this.$message.error('Erro ao gerar QR Code')
      }
    },

    async downloadQRCode(format: 'png' | 'jpg') {
      if (!this.qrCodeDataUrl) {
        this.$message.error('Gere um QR Code primeiro')
        return
      }

      const link = document.createElement('a')
      link.download = `qr-code.${format}`

      if (format === 'png') {
        link.href = this.qrCodeDataUrl
      } else {
        const canvas = document.createElement('canvas')
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            link.href = canvas.toDataURL('image/jpeg', 0.95)
            link.click()
            this.$message.success('QR Code baixado como JPEG!')
          }
        }
        img.src = this.qrCodeDataUrl
        return
      }

      link.click()
      this.$message.success('QR Code baixado como PNG!')
    },

    async copyToClipboard() {
      if (!this.qrCodeDataUrl) {
        this.$message.error('Gere um QR Code primeiro')
        return
      }

      try {
        const response = await fetch(this.qrCodeDataUrl)
        const blob = await response.blob()
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        this.$message.success('QR Code copiado para a área de transferência!')
      } catch (error) {
        console.error(error)
        this.$message.error('Erro ao copiar QR Code')
      }
    }
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
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.input-panel {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 25px;
}

.type-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.type-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.type-btn:hover {
  border-color: var(--accent-color);
}

.type-btn.active {
  background: var(--accent-color);
  color: #000;
  border-color: var(--accent-color);
}

.input-type-content {
  margin-bottom: 20px;
}

.input-field {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 1rem;
  margin-bottom: 10px;
  font-family: inherit;
}

.input-field::placeholder {
  opacity: 0.6;
}

.settings-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.setting-group {
  margin-bottom: 15px;
}

.setting-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color);
  font-size: 0.9rem;
}

.size-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.size-options label {
  display: flex;
  align-items: center;
  font-weight: normal;
  margin-bottom: 0;
  cursor: pointer;
}

.size-options input {
  margin-right: 8px;
  cursor: pointer;
}

.color-input {
  width: 100%;
  height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
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
  width: auto;
  flex: 1;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-color);
}

.preview-panel {
  background: var(--container-bg);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
}

.qr-preview {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  display: inline-block;
}

.qr-preview img {
  max-width: 100%;
  height: auto;
}

.download-buttons {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .size-options {
    grid-template-columns: 1fr;
  }

  .download-buttons {
    flex-direction: column;
  }

  .download-buttons .btn {
    width: 100%;
  }
}
</style>
