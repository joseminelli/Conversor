<template>
  <header class="main-header">
    <div class="logo">
      <router-link to="/">Conversor Universal</router-link>
    </div>
    <nav class="main-nav">
      <ul class="nav-list">
        <li class="dropdown" v-for="category in categories" :key="category">
          <span
            class="nav-trigger"
            :class="{ 'section-active': isActiveCategory(category) }"
            @click="toggleDropdown(category)"
          >
            {{ formatCategory(category) }} <i class="fa-solid fa-chevron-down"></i>
          </span>
          <ul class="dropdown-menu" :class="{ show: openDropdown === category }">
            <li v-for="tool in getToolsByCategory(category)" :key="tool.id">
              <router-link
                :to="tool.route"
                class="nav-link"
                @click="closeDropdown"
              >
                {{ tool.title }}
              </router-link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { tools, getToolsByCategory } from '@/data/toolsRegistry'
import type { ToolCategory } from '@/types/tools'

export default defineComponent({
  name: 'AppHeader',
  setup() {
    const router = useRouter()
    const route = useRoute()

    const categories: ToolCategory[] = ['imagens', 'áudio', 'utilitários']

    const isActiveCategory = (category: ToolCategory): boolean => {
      const categoryTools = getToolsByCategory(category)
      return categoryTools.some(tool => tool.route === route.path)
    }

    const formatCategory = (category: string): string => {
      return category.charAt(0).toUpperCase() + category.slice(1)
    }

    return {
      categories,
      getToolsByCategory,
      isActiveCategory,
      formatCategory,
      openDropdown: null as ToolCategory | null,
      toggleDropdown(category: ToolCategory) {
        this.openDropdown = this.openDropdown === category ? null : category
      },
      closeDropdown() {
        this.openDropdown = null
      }
    }
  }
})
</script>

<style scoped>
.main-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--header-height);
  background: rgba(18, 18, 18, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  z-index: 1000;
}

.logo a {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  text-decoration: none;
  transition: color 0.3s;
}

.logo a:hover {
  color: var(--accent-color);
}

.main-nav {
  margin-left: auto;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 30px;
}

.dropdown {
  position: relative;
}

.nav-trigger {
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.3s;
  font-size: 0.95rem;
}

.nav-trigger:hover {
  color: var(--accent-color);
}

.nav-trigger.section-active {
  color: var(--accent-color);
}

.nav-trigger i {
  font-size: 0.7rem;
  transition: transform 0.3s;
}

.nav-trigger.section-active i {
  transform: rotate(180deg);
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 150%;
  left: -40%;
  transform: translateX(-50%);
  background: #1f1f1f;
  border-radius: 8px;
  padding: 10px 0;
  list-style: none;
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-menu li {
  position: relative;
}

.nav-link {
  display: block;
  padding: 12px 20px;
  white-space: nowrap;
  color: var(--text-color);
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: 0;
  left: 0;
  background: var(--gradient);
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease-out;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

@media (max-width: 768px) {
  .nav-list {
    gap: 15px;
  }

  .nav-trigger {
    font-size: 0.85rem;
  }

  .dropdown-menu {
    left: -30%;
    min-width: 180px;
  }

  .nav-link {
    padding: 10px 15px;
    font-size: 0.9rem;
  }
}
</style>
