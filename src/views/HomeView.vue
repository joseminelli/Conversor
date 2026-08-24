<template>
  <div class="hub-container">
    <h1 ref="title">Suíte de Ferramentas</h1>
    <p class="subtitle" ref="subtitle">
      Todas as suas conversões e utilitários em um só lugar.
    </p>

    <div class="tool-grid" ref="grid">
      <HubToolCard v-for="tool in tools" :key="tool.id" :tool="tool" class="tool-card-item" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import gsap from 'gsap'
import { tools } from '@/data/toolsRegistry'
import HubToolCard from '@/components/layout/HubToolCard.vue'

export default defineComponent({
  name: 'HomeView',
  components: {
    HubToolCard
  },
  data() {
    return {
      tools
    }
  },
  mounted() {
    this.animateEntry()
  },
  methods: {
    animateEntry() {
      const timeline = gsap.timeline()

      // Animate title
      timeline.from(
        this.$refs.title,
        {
          opacity: 0,
          y: -20,
          duration: 0.6,
          ease: 'power2.out'
        },
        0
      )

      // Animate subtitle
      timeline.from(
        this.$refs.subtitle,
        {
          opacity: 0,
          y: -10,
          duration: 0.6,
          ease: 'power2.out'
        },
        0.2
      )

      // Animate cards with stagger
      const cards = this.$refs.grid?.querySelectorAll('.tool-card-item') || []
      timeline.from(
        cards,
        {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(1.3)'
        },
        0.4
      )
    }
  }
})
</script>

<style scoped>
.hub-container {
  max-width: 1200px;
  margin: 40px auto;
  padding: 20px;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 15px;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.7;
  color: var(--text-color);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

@media (max-width: 768px) {
  .hub-container {
    margin: 20px auto;
  }

  h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
    margin-bottom: 30px;
  }

  .tool-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
</style>
