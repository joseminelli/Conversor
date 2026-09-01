<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input
        v-model="query"
        type="text"
        placeholder="Buscar ferramenta..."
        class="search-input"
        @focus="isFocused = true"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <button
        v-if="query"
        class="clear-btn"
        @click="clearSearch"
        aria-label="Limpar busca"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div v-if="isFocused && results.length > 0" class="search-results search-dropdown">
      <button
        v-for="(tool, index) in results"
        :key="tool.id"
        :class="['result-item', { active: index === selectedIndex }]"
        @click="selectTool(tool)"
      >
        <i :class="`fa-solid ${tool.icon}`"></i>
        <div class="result-info">
          <div class="result-title">{{ tool.title }}</div>
          <div class="result-category">{{ tool.category }}</div>
        </div>
      </button>
    </div>

    <div v-if="isFocused && query && results.length === 0" class="no-results">
      Nenhuma ferramenta encontrada
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { searchTools } from '@/utils/search'
import { useRouter } from 'vue-router'
import type { ToolMeta } from '@/types/tools'

export default defineComponent({
  name: 'SearchBar',
  setup() {
    const router = useRouter()
    return { router }
  },
  data() {
    return {
      query: '',
      isFocused: false,
      selectedIndex: 0,
      results: [] as ToolMeta[],
      debounceTimer: null as ReturnType<typeof setTimeout> | null
    }
  },
  watch: {
    query(newQuery: string) {
      if (this.debounceTimer) clearTimeout(this.debounceTimer)

      if (!newQuery.trim()) {
        this.results = []
        this.selectedIndex = 0
        return
      }

      this.debounceTimer = setTimeout(() => {
        this.results = searchTools(newQuery)
        this.selectedIndex = 0
      }, 300)
    }
  },
  methods: {
    clearSearch() {
      this.query = ''
      this.results = []
      this.selectedIndex = 0
    },
    selectTool(tool: ToolMeta) {
      this.router.push(tool.route)
      this.clearSearch()
      this.isFocused = false
    },
    handleKeydown(event: KeyboardEvent) {
      if (!this.results.length) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1)
          break
        case 'ArrowUp':
          event.preventDefault()
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0)
          break
        case 'Enter':
          event.preventDefault()
          this.selectTool(this.results[this.selectedIndex])
          break
        case 'Escape':
          this.isFocused = false
          break
      }
    },
    handleBlur() {
      setTimeout(() => {
        this.isFocused = false
      }, 200)
    }
  },
  beforeUnmount() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }
})
</script>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-color);
  opacity: 0.5;
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 38px;
  background: rgba(40, 40, 40, 0.8);
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 8px;
  color: var(--text-color);
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  background: rgba(40, 40, 40, 0.95);
  box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.1);
}

.search-input::placeholder {
  color: var(--text-color);
  opacity: 0.4;
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-color);
  opacity: 0.5;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.clear-btn:hover {
  opacity: 0.8;
}

.no-results,
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--container-bg);
  border: 1px solid rgba(138, 180, 248, 0.2);
  border-radius: 8px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 1000;
}

.result-item {
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(138, 180, 248, 0.1);
  color: var(--text-color);
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover,
.result-item.active {
  background: rgba(138, 180, 248, 0.1);
}

.result-item i {
  font-size: 1.1rem;
  color: var(--accent-color);
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 2px;
}

.result-category {
  font-size: 0.8rem;
  color: var(--text-color);
  opacity: 0.5;
  text-transform: capitalize;
}

.no-results {
  padding: 20px 16px;
  text-align: center;
  color: var(--text-color);
  opacity: 0.5;
  font-size: 0.9rem;
}
</style>
