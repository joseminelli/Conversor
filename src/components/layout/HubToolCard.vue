<template>
  <router-link v-if="!tool.external" :to="tool.route" class="tool-card">
    <div class="icon">
      <i :class="`fa-solid ${tool.icon}`"></i>
    </div>
    <h3>{{ tool.title }}</h3>
    <p>{{ tool.description }}</p>
  </router-link>
  <a v-else :href="tool.externalUrl" target="_blank" rel="noopener noreferrer" class="tool-card">
    <div class="icon">
      <i :class="`fa-solid ${tool.icon}`"></i>
    </div>
    <h3>{{ tool.title }}</h3>
    <p>{{ tool.description }}</p>
  </a>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { ToolMeta } from '@/types/tools'

export default defineComponent({
  name: 'HubToolCard',
  props: {
    tool: {
      type: Object as PropType<ToolMeta>,
      required: true
    }
  }
})
</script>

<style scoped>
.tool-card {
  background: var(--container-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 25px;
  text-decoration: none;
  color: var(--text-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  display: block;
  height: 100%;
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: var(--accent-color);
}

.icon {
  font-size: 2rem;
  color: var(--accent-color);
  margin-bottom: 15px;
}

h3 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: #fff;
}

p {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.7;
  margin: 0;
}
</style>
