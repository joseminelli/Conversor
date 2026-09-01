<template>
  <div class="app-container">
    <AppHeader />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import AppHeader from './components/layout/AppHeader.vue'

export default defineComponent({
  name: 'App',
  components: {
    AppHeader
  },
  setup() {
    const route = useRoute()
    return {
      route,
      enterActiveClass: 'fade-enter-active',
      leaveActiveClass: 'fade-leave-active',
      enterFromClass: 'fade-enter-from',
      leaveToClass: 'fade-leave-to'
    }
  }
})
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
