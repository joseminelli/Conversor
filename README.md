# Conversor Universal - Suite de Ferramentas Online

Uma aplicação Vue 3 + TypeScript com 8 ferramentas online para conversão e edição de imagens e áudio.

## 🎯 Características

- ✅ **8 Ferramentas Completas:**
  - 🖼️ Compressor de Imagem (JPEG, PNG, WebP)
  - 🖼️ Redimensionador/Cropper de Imagem
  - 🖼️ Editor de Imagem (filtros, brilho, contraste, etc.)
  - 🖼️ Marca d'Água (texto e logo)
  - 🎨 Color Picker (HEX, RGB, HSL)
  - 🎵 Cortador de Áudio
  - 🎵 Conversor de Áudio (MP3, WAV)
  - 📱 Gerador de QR Code

- ✨ **Tecnologias Modernas:**
  - Vue 3 com Options API
  - TypeScript (strict mode)
  - Vite para build rápido
  - Vue Router v4 para SPA
  - GSAP para animações suaves
  - Tailwind-friendly CSS
  - Suporte a GitHub Pages

- 🎨 **Design Profissional:**
  - Tema escuro elegante
  - Gradiente único (#8ab4f8 → #c58af9 → #f48aab)
  - Glassmorphism effects
  - Animações suaves de entrada
  - Transições entre rotas
  - Drag-and-drop em todas as ferramentas

## 🚀 Quick Start

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:5173 no navegador.

### Build para Produção

```bash
npm run build
```

A pasta `dist` contém os arquivos otimizados.

### Preview do Build

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── main.ts                 # Entrada da aplicação
├── App.vue                 # Componente raiz com animações
├── assets/
│   ├── global.css         # Estilos globais e theme
│   └── fonts.css          # Importações de fontes
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue      # Header com navegação
│   │   ├── HubToolCard.vue    # Card de ferramenta
│   │   └── ToolPageLayout.vue # Layout padrão das páginas
│   └── common/
│       ├── FileDropZone.vue   # Upload com drag-drop reutilizável
│       └── LabeledSlider.vue  # Slider com label
├── data/
│   └── toolsRegistry.ts   # Registro único de ferramentas
├── types/
│   ├── tools.ts           # Tipos principais
│   ├── audio.ts           # Interfaces de áudio
│   └── lamejs.d.ts        # Tipos para lamejs (MP3)
├── utils/
│   ├── file.ts            # formatFileSize, etc
│   ├── audio.ts           # formatTime, bufferToWave, encodeToMp3
│   └── color.ts           # rgbToHex, rgbToHsl, etc
├── views/
│   ├── HomeView.vue       # Hub com grid de ferramentas
│   └── tools/
│       ├── ImageCompressorView.vue
│       ├── ImageResizerView.vue
│       ├── ImageEditorView.vue
│       ├── ImageWatermarkView.vue
│       ├── ColorPickerView.vue
│       ├── AudioCutterView.vue
│       ├── AudioConverterView.vue
│       └── QrCodeGeneratorView.vue
└── router/
    └── index.ts           # Rotas Vue Router

public/
├── 404.html              # Fallback SPA para GitHub Pages
└── index.html            # Raiz

vite.config.ts            # Configuração Vite com alias @
tsconfig.json             # Configuração TypeScript
package.json              # Dependências
```

## 🛠️ Tecnologias

- **Vue 3** - Framework progressivo
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Vue Router** - Roteamento SPA
- **GSAP** - Animações profissionais
- **qrcode** - Geração de QR codes
- **lamejs** - Codificação MP3 (legacy)

## 🌐 Deploy no GitHub Pages

### Passos:

1. **Configurar o repositório:**
   ```bash
   git remote set-url origin https://github.com/seu-usuario/seu-repo.git
   ```

2. **Atualizar package.json:**
   ```json
   "homepage": "https://seu-usuario.github.io/seu-repo"
   ```

3. **Build e deploy:**
   ```bash
   npm run build
   git add dist
   git commit -m "Deploy"
   git push origin main
   ```

4. **Configurar GitHub Pages:**
   - Vá para Settings → Pages
   - Source: Deploy from branch
   - Branch: main, pasta: /(root)
   - Salve

5. **Configurar base path (automático):**
   - `vite.config.ts` detecta GitHub Pages automaticamente
   - O 404.html redireciona rotas SPA

## 📦 Dependências Principais

```json
{
  "vue": "^3.4.0",
  "vue-router": "^4.3.0",
  "gsap": "^3.12.0",
  "qrcode": "^1.5.3",
  "typescript": "^5.4.0",
  "vite": "^5.0.0"
}
```

## 🎓 Expandir com Novas Ferramentas

### 1. Criar o Componente

Crie `src/views/tools/MeuEditor.vue`:

```vue
<template>
  <div class="container">
    <div class="tool-header">
      <h1><i class="fa-solid fa-icon"></i> Meu Editor</h1>
      <p>Descrição...</p>
    </div>
    <!-- seu conteúdo -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'MeuEditorView'
})
</script>
```

### 2. Registrar no Registry

Edite `src/data/toolsRegistry.ts`:

```typescript
export const tools: ToolMeta[] = [
  // ... ferramentas existentes
  {
    id: 'meu-editor',
    title: 'Meu Editor',
    description: 'Descrição da ferramenta',
    icon: 'fa-icon',
    route: '/meu-editor',
    category: 'utilitários'
  }
]
```

### 3. Adicionar Rota

Edite `src/main.ts`:

```typescript
import MeuEditorView from './views/tools/MeuEditorView.vue'

// Na configuração do router:
{
  path: '/meu-editor',
  name: 'MeuEditor',
  component: MeuEditorView
}
```

Pronto! A ferramenta aparecerá automaticamente no hub e navegação.

## 🎨 Tema Customização

O tema é definido em `src/assets/global.css` com variáveis CSS:

```css
:root {
  --gradient: linear-gradient(135deg, #8ab4f8, #c58af9, #f48aab);
  --text-color: #e4e4e4;
  --bg-color: #121212;
  --accent-color: #8ab4f8;
  /* ... */
}
```

Altere estas variáveis para customizar cores globalmente.

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run preview` | Preview do build |

## 📝 Notas Importantes

- **Audio MP3**: Usa lamejs via CDN (lib legada)
- **Web Audio API**: Todos os áudios processados localmente (sem servidor)
- **Canvas**: Imagens editadas via canvas 2D do navegador
- **Drag-Drop**: Disponível em TODAS as 8 ferramentas
- **Options API**: Todos os componentes usam Options API (não Composition)

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-ferramenta`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova ferramenta'`
3. Push: `git push origin feature/nova-ferramenta`
4. Abra um Pull Request

## 📄 Licença

MIT License - veja LICENSE para detalhes

---

**Criado com ❤️ usando Vue 3 + TypeScript**
