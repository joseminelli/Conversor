import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createDiscreteApi } from 'naive-ui'

import App from './App.vue'

import './assets/global.css'
import './assets/fonts.css'

// Import all tool views
import HomeView from './views/HomeView.vue'
import ImageCompressorView from './views/tools/ImageCompressorView.vue'
import ImageResizerView from './views/tools/ImageResizerView.vue'
import ImageEditorView from './views/tools/ImageEditorView.vue'
import ImageWatermarkView from './views/tools/ImageWatermarkView.vue'
import ColorPickerView from './views/tools/ColorPickerView.vue'
import AudioCutterView from './views/tools/AudioCutterView.vue'
import AudioConverterView from './views/tools/AudioConverterView.vue'
import QrCodeGeneratorView from './views/tools/QrCodeGeneratorView.vue'
import TextConverterView from './views/tools/TextConverterView.vue'

const app = createApp(App)

// Setup Naive UI discrete API for notifications
const { message } = createDiscreteApi(['message'])
app.config.globalProperties.$message = message

// Setup Vue Router
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeView
    },
    {
      path: '/image-compressor',
      name: 'ImageCompressor',
      component: ImageCompressorView
    },
    {
      path: '/image-resizer',
      name: 'ImageResizer',
      component: ImageResizerView
    },
    {
      path: '/image-editor',
      name: 'ImageEditor',
      component: ImageEditorView
    },
    {
      path: '/image-watermark',
      name: 'ImageWatermark',
      component: ImageWatermarkView
    },
    {
      path: '/color-picker',
      name: 'ColorPicker',
      component: ColorPickerView
    },
    {
      path: '/audio-cutter',
      name: 'AudioCutter',
      component: AudioCutterView
    },
    {
      path: '/audio-converter',
      name: 'AudioConverter',
      component: AudioConverterView
    },
    {
      path: '/qr-code-generator',
      name: 'QrCodeGenerator',
      component: QrCodeGeneratorView
    },
    {
      path: '/text-converter',
      name: 'TextConverter',
      component: TextConverterView
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

app.use(router)

app.mount('#app')
