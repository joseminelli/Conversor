<template>
  <div class="hub-container">
    <!-- Hero Section -->
    <div class="hero-section" ref="hero">
      <div class="hero-background"></div>
      <div class="hero-content">
        <h1 ref="title" class="hero-title">Conversor Universal</h1>
        <p ref="subtitle" class="hero-subtitle">
          Converta, edite e otimize suas imagens e áudios em um só lugar
        </p>
        <div ref="cta" class="hero-cta">
          <p class="cta-text">Escolha uma ferramenta para começar ↓</p>
        </div>
      </div>
      <div class="hero-gradient"></div>
    </div>

    <!-- Categories Section -->
    <div class="categories-wrapper">
      <!-- Favorites Section -->
      <section v-if="favoriteTools.length > 0" class="category-section" ref="favoritesSection">
        <div class="category-header">
          <div class="category-icon">
            <i class="fa-solid fa-star"></i>
          </div>
          <div>
            <h2>⭐ Seus Favoritos</h2>
            <p>Ferramentas que você marca para acessar rápido</p>
          </div>
        </div>
        <div class="tool-grid">
          <HubToolCard
            v-for="tool in favoriteTools"
            :key="tool.id"
            :tool="tool"
            class="tool-card-item"
          />
        </div>
      </section>

      <!-- Recent Tools Section -->
      <section v-if="recentTools.length > 0" class="category-section" ref="recentsSection">
        <div class="category-header">
          <div class="category-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div>
            <h2>🕐 Usados Recentemente</h2>
            <p>Ferramentas que você acessou por último</p>
          </div>
        </div>
        <div class="tool-grid">
          <HubToolCard
            v-for="tool in recentTools"
            :key="tool.id"
            :tool="tool"
            class="tool-card-item"
          />
        </div>
      </section>

      <!-- Image Tools -->
      <section class="category-section" ref="imageSection">
        <div class="category-header">
          <div class="category-icon">
            <i class="fa-solid fa-image"></i>
          </div>
          <div>
            <h2>Ferramentas de Imagem</h2>
            <p>Comprima, redimensione, edite e aplique efeitos</p>
          </div>
        </div>
        <div class="tool-grid">
          <HubToolCard
            v-for="tool in imageTools"
            :key="tool.id"
            :tool="tool"
            class="tool-card-item"
          />
        </div>
      </section>

      <!-- Audio Tools -->
      <section class="category-section" ref="audioSection">
        <div class="category-header">
          <div class="category-icon">
            <i class="fa-solid fa-file-waveform"></i>
          </div>
          <div>
            <h2>Ferramentas de Áudio</h2>
            <p>Corte, converta e processe seus arquivos de áudio</p>
          </div>
        </div>
        <div class="tool-grid">
          <HubToolCard
            v-for="tool in audioTools"
            :key="tool.id"
            :tool="tool"
            class="tool-card-item"
          />
        </div>
      </section>

      <!-- Utility Tools -->
      <section class="category-section" ref="utilitySection">
        <div class="category-header">
          <div class="category-icon">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h2>Utilitários</h2>
            <p>Ferramentas práticas para suas necessidades</p>
          </div>
        </div>
        <div class="tool-grid">
          <HubToolCard
            v-for="tool in utilityTools"
            :key="tool.id"
            :tool="tool"
            class="tool-card-item"
          />
        </div>
      </section>

      <!-- Document Tools -->
      <section class="category-section" ref="documentSection">
        <div class="category-header">
          <div class="category-icon">
            <i class="fa-solid fa-file-pdf"></i>
          </div>
          <div>
            <h2>Documentos</h2>
            <p>Converta, comprima e otimize seus PDFs</p>
          </div>
        </div>
        <div class="tool-grid">
          <HubToolCard
            v-for="tool in documentTools"
            :key="tool.id"
            :tool="tool"
            class="tool-card-item"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import gsap from 'gsap'
import { getToolsByCategory, tools as allTools } from '@/data/toolsRegistry'
import { getFavorites, getRecentTools } from '@/utils/storage'
import HubToolCard from '@/components/layout/HubToolCard.vue'
import type { ToolMeta } from '@/types/tools'

export default defineComponent({
  name: 'HomeView',
  components: {
    HubToolCard
  },
  data() {
    return {
      favoriteTools: [] as ToolMeta[],
      recentTools: [] as ToolMeta[]
    }
  },
  computed: {
    imageTools() {
      return getToolsByCategory('imagens')
    },
    audioTools() {
      return getToolsByCategory('áudio')
    },
    utilityTools() {
      return getToolsByCategory('utilitários')
    },
    documentTools() {
      return getToolsByCategory('documentos')
    }
  },
  mounted() {
    this.loadFavoritesAndRecents()
    this.animateEntry()
    window.addEventListener('favorites-changed', this.onFavoritesChanged)
    window.addEventListener('storage', this.onStorageChanged)
  },
  beforeUnmount() {
    window.removeEventListener('favorites-changed', this.onFavoritesChanged)
    window.removeEventListener('storage', this.onStorageChanged)
  },
  methods: {
    loadFavoritesAndRecents() {
      const favoriteIds = getFavorites()
      const recentIds = getRecentTools()

      this.favoriteTools = favoriteIds
        .map(id => allTools.find(t => t.id === id))
        .filter((tool): tool is ToolMeta => tool !== undefined)

      this.recentTools = recentIds
        .map(id => allTools.find(t => t.id === id))
        .filter((tool): tool is ToolMeta => tool !== undefined)
    },
    onFavoritesChanged() {
      this.loadFavoritesAndRecents()
    },
    onStorageChanged() {
      this.loadFavoritesAndRecents()
    },
    animateEntry() {
      const timeline = gsap.timeline()

      // Animate hero background
      const hero = this.$refs.hero as HTMLElement | undefined
      if (hero) {
        timeline.from(
          hero,
          {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
          },
          0
        )
      }

      // Animate title
      const title = this.$refs.title as HTMLElement | undefined
      if (title) {
        timeline.from(
          title,
          {
            opacity: 0,
            y: -30,
            duration: 0.7,
            ease: 'power2.out'
          },
          0.1
        )
      }

      // Animate subtitle
      const subtitle = this.$refs.subtitle as HTMLElement | undefined
      if (subtitle) {
        timeline.from(
          subtitle,
          {
            opacity: 0,
            y: -20,
            duration: 0.7,
            ease: 'power2.out'
          },
          0.2
        )
      }

      // Animate CTA
      const cta = this.$refs.cta as HTMLElement | undefined
      if (cta) {
        timeline.from(
          cta,
          {
            opacity: 0,
            y: -10,
            duration: 0.6,
            ease: 'power2.out'
          },
          0.3
        )
      }

      // Animate category sections
      const favoritesSection = this.$refs.favoritesSection as HTMLElement | undefined
      const recentsSection = this.$refs.recentsSection as HTMLElement | undefined
      const imageSection = this.$refs.imageSection as HTMLElement | undefined
      const audioSection = this.$refs.audioSection as HTMLElement | undefined
      const utilitySection = this.$refs.utilitySection as HTMLElement | undefined

      const sections = [favoritesSection, recentsSection, imageSection, audioSection, utilitySection].filter(Boolean)

      sections.forEach((section, index) => {
        if (section) {
          timeline.from(
            section,
            {
              opacity: 0,
              y: 30,
              duration: 0.6,
              ease: 'back.out(1.1)'
            },
            0.5 + index * 0.15
          )
        }
      })

      // Animate all cards with stagger
      setTimeout(() => {
        const cards = document.querySelectorAll('.tool-card-item')
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            {
              opacity: 0,
              y: 20
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.05,
              ease: 'back.out(1.2)'
            }
          )
        }
      }, 800)
    }
  }
})
</script>

<style scoped>
.hub-container {
  width: 100%;
}

/* Hero Section */
.hero-section {
  position: relative;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 20% 50%, rgba(138, 180, 248, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(197, 138, 249, 0.15) 0%, transparent 50%);
  z-index: 0;
}

.hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 200px;
  background: linear-gradient(to bottom, transparent, var(--bg-color));
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 700px;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  letter-spacing: -2px;
  margin-bottom: 20px;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 1.4rem;
  color: var(--text-color);
  opacity: 0.8;
  margin-bottom: 30px;
  font-weight: 300;
  line-height: 1.5;
}

.hero-cta {
  margin-top: 40px;
}

.cta-text {
  font-size: 0.95rem;
  color: var(--accent-color);
  font-weight: 500;
  opacity: 0.8;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* Categories Wrapper */
.categories-wrapper {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 20px 80px;
}

.category-section {
  margin-bottom: 80px;
}

.category-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(138, 180, 248, 0.2);
}

.category-icon {
  font-size: 2.5rem;
  color: var(--accent-color);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(138, 180, 248, 0.1);
  border-radius: 12px;
}

.category-header h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #fff;
}

.category-header p {
  font-size: 1rem;
  color: var(--text-color);
  opacity: 0.6;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .category-header {
    gap: 15px;
  }

  .category-icon {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }

  .category-header h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 300px;
    padding: 40px 20px;
  }

  .hero-title {
    font-size: 2.5rem;
    letter-spacing: -1px;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .categories-wrapper {
    padding: 0 20px 40px;
  }

  .category-section {
    margin-bottom: 50px;
  }

  .category-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-bottom: 1px solid rgba(138, 180, 248, 0.15);
  }

  .category-icon {
    width: 55px;
    height: 55px;
  }

  .category-header h2 {
    font-size: 1.3rem;
  }

  .category-header p {
    font-size: 0.9rem;
  }

  .tool-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
  }

  .category-header h2 {
    font-size: 1.1rem;
  }

  .category-header p {
    font-size: 0.85rem;
  }

  .hero-section {
    padding: 30px 15px;
  }

  .categories-wrapper {
    padding: 0 15px 30px;
  }
}
</style>
