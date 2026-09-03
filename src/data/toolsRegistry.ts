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
    id: 'text-converter',
    title: 'Conversor de Texto',
    description: 'Converta textos entre diferentes bases: binário, hexadecimal, Base64, ASCII e mais.',
    icon: 'fa-language',
    route: '/text-converter',
    category: 'utilitários'
  },
  {
    id: 'image-batch-resizer',
    title: 'Redimensionador em Lote',
    description: 'Redimensione múltiplas imagens de uma vez com as mesmas configurações.',
    icon: 'fa-images',
    route: '/image-batch-resizer',
    category: 'imagens'
  },
  {
    id: 'document-converter',
    title: 'Conversor de Documentos',
    description: 'Converta entre PDF e imagens com facilidade.',
    icon: 'fa-file-pdf',
    route: '/document-converter',
    category: 'documentos'
  },
  {
    id: 'pdf-compressor',
    title: 'Compressor de PDF',
    description: 'Reduza o tamanho dos seus PDFs com dois modos de compressão.',
    icon: 'fa-file-zipper',
    route: '/pdf-compressor',
    category: 'documentos'
  },
  {
    id: 'youtube-downloader',
    title: 'Baixador de YouTube',
    description: 'Baixe vídeos e áudio do YouTube em diversos formatos e qualidades.',
    icon: 'fa-brands fa-youtube',
    route: '/youtube-downloader',
    category: 'downloads'
  },
  {
    id: 'instagram-downloader',
    title: 'Baixador de Instagram',
    description: 'Baixe fotos, vídeos e stories do Instagram com qualidade original.',
    icon: 'fa-brands fa-instagram',
    route: '/instagram-downloader',
    category: 'downloads'
  },
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
