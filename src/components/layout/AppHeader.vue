<template>
  <header class="main-header">
    <div class="header-container">
      <div class="logo">
        <router-link to="/">
          <i class="fa-solid fa-toolbox"></i>
          <span class="logo-text">Conversor</span>
        </router-link>
      </div>

      <!-- Desktop Navigation -->
      <nav class="desktop-nav">
        <div class="nav-dropdown" v-for="category in categories" :key="category">
          <button
            class="nav-category"
            :class="{ active: isActiveCategory(category) }"
            @mouseenter="openCategory = category"
            @mouseleave="openCategory = null"
          >
            {{ formatCategory(category) }}
            <i class="fa-solid fa-chevron-down"></i>
          </button>

          <div
            class="nav-submenu"
            :class="{ show: openCategory === category }"
            @mouseenter="openCategory = category"
            @mouseleave="openCategory = null"
          >
            <router-link
              v-for="tool in getToolsByCategory(category)"
              :key="tool.id"
              :to="tool.route"
              class="submenu-link"
              @click="openCategory = null"
            >
              <i :class="`fa-solid ${tool.icon}`"></i>
              {{ tool.title }}
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Mobile Menu Button -->
      <button
        class="mobile-menu-btn"
        @click="mobileMenuOpen = !mobileMenuOpen"
        :class="{ active: mobileMenuOpen }"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Mobile Navigation -->
    <nav class="mobile-nav" :class="{ open: mobileMenuOpen }">
      <div class="mobile-nav-content">
        <div class="mobile-category" v-for="category in categories" :key="category">
          <button
            class="mobile-category-btn"
            @click="toggleMobileCategory(category)"
            :class="{ active: mobileCategoryOpen === category }"
          >
            {{ formatCategory(category) }}
            <i class="fa-solid fa-chevron-down"></i>
          </button>

          <div class="mobile-submenu" v-show="mobileCategoryOpen === category">
            <router-link
              v-for="tool in getToolsByCategory(category)"
              :key="tool.id"
              :to="tool.route"
              class="mobile-submenu-link"
              @click="closeMobileMenu"
            >
              <i :class="`fa-solid ${tool.icon}`"></i>
              {{ tool.title }}
            </router-link>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { getToolsByCategory } from '@/data/toolsRegistry'
import type { ToolCategory } from '@/types/tools'

export default defineComponent({
  name: 'AppHeader',
  data() {
    return {
      categories: ['imagens', 'áudio', 'utilitários'] as ToolCategory[],
      openCategory: null as ToolCategory | null,
      mobileMenuOpen: false,
      mobileCategoryOpen: null as ToolCategory | null
    }
  },
  setup() {
    const route = useRoute()
    return { route }
  },
  computed: {
    getToolsByCategory() {
      return getToolsByCategory
    }
  },
  methods: {
    formatCategory(category: string): string {
      return category.charAt(0).toUpperCase() + category.slice(1)
    },

    isActiveCategory(category: ToolCategory): boolean {
      const categoryTools = getToolsByCategory(category)
      return categoryTools.some(tool => tool.route === this.route.path)
    },

    toggleMobileCategory(category: ToolCategory) {
      this.mobileCategoryOpen = this.mobileCategoryOpen === category ? null : category
    },

    closeMobileMenu() {
      this.mobileMenuOpen = false
      this.mobileCategoryOpen = null
    }
  },

  watch: {
    '$route.path'() {
      this.closeMobileMenu()
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
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  padding-top: 0;
}

.header-container {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  max-width: 100%;
}

.logo {
  flex-shrink: 0;
}

.logo a {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.3s;
}

.logo a:hover {
  color: var(--accent-color);
}

.logo-text {
  display: none;
}

@media (min-width: 640px) {
  .logo-text {
    display: inline;
  }
}

/* Desktop Navigation */
.desktop-nav {
  display: none;
  margin-left: auto;
  gap: 0;
}

@media (min-width: 769px) {
  .desktop-nav {
    display: flex;
    gap: 5px;
  }
}

.nav-dropdown {
  position: relative;
  height: var(--header-height);
  display: flex;
  align-items: center;
}

.nav-category {
  height: 100%;
  padding: 0 16px;
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  position: relative;
}

.nav-category:hover {
  color: var(--accent-color);
}

.nav-category.active {
  color: var(--accent-color);
}

.nav-category i {
  font-size: 0.7rem;
  transition: transform 0.3s;
}

.nav-category.active i {
  transform: rotate(180deg);
}

.nav-category::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

.nav-category:hover::after,
.nav-category.active::after {
  transform: scaleX(1);
  transform-origin: left;
}

.nav-submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 220px;
  padding: 8px 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.nav-submenu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.submenu-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.submenu-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--accent-color);
  padding-left: 24px;
}

.submenu-link i {
  width: 18px;
  text-align: center;
  opacity: 0.7;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-left: auto;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }
}

.mobile-menu-btn span {
  width: 24px;
  height: 2.5px;
  background: var(--text-color);
  border-radius: 2px;
  transition: all 0.3s;
}

.mobile-menu-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.mobile-menu-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  position: absolute;
  top: var(--header-height);
  left: 0;
  right: 0;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

@media (max-width: 768px) {
  .mobile-nav {
    display: block;
  }

  .mobile-nav.open {
    max-height: 500px;
  }
}

.mobile-nav-content {
  padding: 8px 0;
}

.mobile-category {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.mobile-category:last-child {
  border-bottom: none;
}

.mobile-category-btn {
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  text-align: left;
}

.mobile-category-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--accent-color);
}

.mobile-category-btn.active {
  color: var(--accent-color);
}

.mobile-category-btn i {
  font-size: 0.7rem;
  transition: transform 0.3s;
}

.mobile-category-btn.active i {
  transform: rotate(180deg);
}

.mobile-submenu {
  background: rgba(0, 0, 0, 0.3);
  padding: 0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.mobile-submenu-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px 12px 40px;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 0.9rem;
  border-left: 3px solid transparent;
}

.mobile-submenu-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--accent-color);
  border-left-color: var(--accent-color);
}

.mobile-submenu-link.router-link-active {
  color: var(--accent-color);
  border-left-color: var(--accent-color);
}

.mobile-submenu-link i {
  width: 16px;
  text-align: center;
  opacity: 0.7;
}
</style>
