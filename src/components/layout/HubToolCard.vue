<template>
  <router-link v-if="!tool.external" :to="tool.route" class="tool-card">
    <div class="card-background"></div>
    <button v-if="showFavoriteButton" class="favorite-btn" :class="{ favorited: isFavorite }" @click.prevent="toggleFavorite" :title="isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'">
      <i :class="`fa-${isFavorite ? 'solid' : 'regular'} fa-star`"></i>
    </button>
    <div class="icon-wrapper">
      <div class="icon-bg"></div>
      <i :class="`fa-solid ${tool.icon}`"></i>
    </div>
    <h3>{{ tool.title }}</h3>
    <p>{{ tool.description }}</p>
    <div class="arrow">
      <i class="fa-solid fa-arrow-right"></i>
    </div>
  </router-link>
  <a v-else :href="tool.externalUrl" target="_blank" rel="noopener noreferrer" class="tool-card">
    <div class="card-background"></div>
    <div class="icon-wrapper">
      <div class="icon-bg"></div>
      <i :class="`fa-solid ${tool.icon}`"></i>
    </div>
    <h3>{{ tool.title }}</h3>
    <p>{{ tool.description }}</p>
    <div class="arrow">
      <i class="fa-solid fa-arrow-up-right"></i>
    </div>
  </a>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { ToolMeta } from '@/types/tools'
import { isFavorite, toggleFavorite } from '@/utils/storage'

export default defineComponent({
  name: 'HubToolCard',
  props: {
    tool: {
      type: Object as PropType<ToolMeta>,
      required: true
    },
    showFavoriteButton: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isFavorite: false
    }
  },
  mounted() {
    this.checkFavorite()
    window.addEventListener('storage', this.onStorageChange)
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.onStorageChange)
  },
  methods: {
    checkFavorite() {
      this.isFavorite = isFavorite(this.tool.id)
    },
    toggleFavorite() {
      toggleFavorite(this.tool.id)
      this.isFavorite = !this.isFavorite
      window.dispatchEvent(new CustomEvent('favorites-changed'))
    },
    onStorageChange() {
      this.checkFavorite()
    }
  },
  watch: {
    'tool.id': {
      handler() {
        this.checkFavorite()
      }
    }
  }
})
</script>

<style scoped>
.tool-card {
  position: relative;
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 16px;
  padding: 30px;
  text-decoration: none;
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at top right,
    rgba(138, 180, 248, 0.08) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
}

.tool-card:hover .card-background {
  opacity: 1;
}

.tool-card:hover {
  transform: translateY(-8px);
  border-color: rgba(138, 180, 248, 0.5);
  box-shadow: 0 20px 40px rgba(138, 180, 248, 0.1), 0 0 60px rgba(138, 180, 248, 0.05);
}

.icon-wrapper {
  position: relative;
  margin-bottom: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  z-index: 2;
}

.icon-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(138, 180, 248, 0.15), rgba(197, 138, 249, 0.1));
  border-radius: 12px;
  transition: transform 0.4s ease;
}

.tool-card:hover .icon-bg {
  transform: scale(1.15);
}

.icon-wrapper i {
  font-size: 1.8rem;
  color: var(--accent-color);
  position: relative;
  z-index: 1;
  transition: transform 0.4s ease;
}

.tool-card:hover .icon-wrapper i {
  transform: scale(1.2);
}

h3 {
  position: relative;
  z-index: 2;
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  transition: color 0.3s ease;
}

.tool-card:hover h3 {
  color: var(--accent-color);
}

p {
  position: relative;
  z-index: 2;
  font-size: 0.9rem;
  line-height: 1.6;
  opacity: 0.65;
  margin: 0 0 15px 0;
  flex-grow: 1;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(138, 180, 248, 0.1);
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 8px;
  color: rgba(138, 180, 248, 0.6);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.favorite-btn:hover {
  background: rgba(138, 180, 248, 0.2);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.favorite-btn.favorited {
  background: rgba(248, 165, 71, 0.15);
  border-color: #faa54a;
  color: #faa54a;
}

.favorite-btn.favorited:hover {
  background: rgba(248, 165, 71, 0.25);
  border-color: #faa54a;
  box-shadow: 0 0 12px rgba(250, 165, 74, 0.3);
}

.favorite-btn i {
  font-size: 1rem;
  transition: all 0.2s ease;
}

.arrow {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(138, 180, 248, 0.1);
  border-radius: 8px;
  color: var(--accent-color);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateX(-10px);
}

.tool-card:hover .arrow {
  opacity: 1;
  transform: translateX(0);
  background: rgba(138, 180, 248, 0.2);
}

@media (max-width: 768px) {
  .tool-card {
    padding: 25px;
    border-radius: 14px;
  }

  .tool-card:hover {
    transform: translateY(-4px);
  }

  .icon-wrapper {
    width: 45px;
    height: 45px;
  }

  .icon-wrapper i {
    font-size: 1.5rem;
  }

  h3 {
    font-size: 1.1rem;
  }

  p {
    font-size: 0.85rem;
  }
}
</style>
