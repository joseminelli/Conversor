<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-brands fa-instagram"></i> Baixador do Instagram</h1>
      <p>Baixe fotos e vídeos do Instagram</p>
    </div>

    <div class="tool-content">
      <div class="input-section">
        <label>Cole a URL do Instagram:</label>
        <div class="input-wrapper">
          <input v-model="postUrl" type="text" placeholder="https://www.instagram.com/p/..." />
          <button @click="fetch" class="btn">Buscar</button>
        </div>
      </div>

      <div v-if="postInfo" class="post-info">
        <img v-if="postInfo.thumbnail" :src="postInfo.thumbnail" />
        <h3>{{ postInfo.title }}</h3>
        <p v-if="postInfo.author">{{ postInfo.author }}</p>
        <button @click="download" class="btn btn-primary">Baixar</button>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'InstagramDownloaderView',
  data() {
    return {
      postUrl: '',
      postInfo: null as any,
      error: ''
    }
  },
  methods: {
    async fetch() {
      this.error = ''
      if (!this.postUrl) {
        this.error = 'Cole uma URL do Instagram'
        return
      }

      try {
        const response = await fetch('http://localhost:3000/instagram/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: this.postUrl })
        })
        const data = await response.json()
        this.postInfo = data
      } catch (err) {
        this.error = `Erro: ${err}`
      }
    },
    async download() {
      try {
        const response = await fetch('http://localhost:3000/instagram/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: this.postUrl })
        })
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'instagram.mp4'
        a.click()
      } catch (err) {
        this.error = `Erro: ${err}`
      }
    }
  }
})
</script>

<style scoped>
.container { max-width: 900px; margin: 0 auto; padding: 20px; }
.tool-header { text-align: center; margin-bottom: 40px; }
.tool-header h1 { font-size: 2.5rem; color: #833ab4; }
.tool-content { background: white; border-radius: 12px; padding: 30px; }
.input-section { margin-bottom: 30px; }
.input-wrapper { display: flex; gap: 10px; }
input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
.btn { padding: 10px 20px; background: #833ab4; color: white; border: none; border-radius: 8px; cursor: pointer; }
.btn:hover { background: #c13584; }
.post-info { text-align: center; }
.post-info img { max-width: 300px; border-radius: 8px; }
.error { color: red; padding: 15px; background: #fee; border-radius: 8px; }
</style>
