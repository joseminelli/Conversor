import type { ToolMeta } from '@/types/tools'

export const tools: ToolMeta[] = [
  {
    id: 'image-compressor',
    title: 'Conversor de Imagem',
    description: 'Reduza o tamanho das suas imagens ou mude o formato mantendo a qualidade com controle de compressão.',
    icon: 'fa-compress',
    route: '/image-compressor',
    category: 'imagens'
  },
  {
    id: 'image-resizer',
    title: 'Cortar e Redimensionar',
    description: 'Ajuste o enquadramento e a escala das suas imagens com precisão.',
    icon: 'fa-crop-simple',
    route: '/image-resizer',
    category: 'imagens'
  },
  {
    id: 'audio-cutter',
    title: 'Cortador de Áudio',
    description: 'Corte trechos de arquivos de áudio diretamente no seu navegador.',
    icon: 'fa-scissors',
    route: '/audio-cutter',
    category: 'áudio'
  },
  {
    id: 'image-watermark',
    title: 'Marca d\'Água',
    description: 'Aplique um texto ou logo como marca d\'água em suas imagens de forma fácil.',
    icon: 'fa-copyright',
    route: '/image-watermark',
    category: 'imagens'
  },
  {
    id: 'color-picker',
    title: 'Conta-gotas de Cores',
    description: 'Carregue uma imagem e capture o código de qualquer cor com precisão.',
    icon: 'fa-eye-dropper',
    route: '/color-picker',
    category: 'utilitários'
  },
  {
    id: 'audio-converter',
    title: 'Conversor de Áudio',
    description: 'Altere o formato (MP3, WAV) e ajuste o volume dos seus arquivos de áudio.',
    icon: 'fa-sliders',
    route: '/audio-converter',
    category: 'áudio'
  },
  {
    id: 'qr-code-generator',
    title: 'Gerador de QR Code',
    description: 'Crie QR codes customizáveis a partir de texto, URLs ou informações de contato.',
    icon: 'fa-qrcode',
    route: '/qr-code-generator',
    category: 'utilitários'
  },
  {
    id: 'image-editor',
    title: 'Editor de Imagem',
    description: 'Aplique filtros e ajustes como brilho, contraste, desfoque e muito mais.',
    icon: 'fa-wand-magic-sparkles',
    route: '/image-editor',
    category: 'imagens'
  },
  {
    id: 'roll2paper',
    title: 'Roll2Paper',
    description: 'Transform sua ficha de RPG .cah em um PDF pronto para imprimir, com layout personalizável e suporte a múltiplas páginas.',
    icon: 'fa-dice',
    route: 'https://joseminelli.github.io/Roll2Paper/',
    category: 'utilitários',
    external: true,
    externalUrl: 'https://joseminelli.github.io/Roll2Paper/'
  }
]

export function getToolByRoute(route: string): ToolMeta | undefined {
  return tools.find(tool => tool.route === route)
}

export function getToolsByCategory(category: string): ToolMeta[] {
  return tools.filter(tool => tool.category === category)
}

export function getInternalTools(): ToolMeta[] {
  return tools.filter(tool => !tool.external)
}
