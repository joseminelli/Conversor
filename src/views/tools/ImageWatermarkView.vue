<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-copyright"></i> Marca d'Água</h1>
      <p>Aplique um texto ou logo como marca d'água em suas imagens de forma fácil</p>
    </div>
    <div class="tool-content">
      <p style="text-align: center; opacity: 0.7;">Componente em desenvolvimento...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ImageWatermarkView'
})
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
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
  padding: 40px 20px;
}
</style>
