export type ToolCategory = 'imagens' | 'áudio' | 'utilitários' | 'documentos'

export interface ToolMeta {
  id: string
  title: string
  description: string
  icon: string
  route: string
  category: ToolCategory
  external?: boolean
  externalUrl?: string
}

export interface ImageState {
  originalImage: HTMLImageElement | null
  processedBlob: Blob | null
  isProcessing: boolean
}

export interface AudioState {
  audioContext: AudioContext | null
  audioBuffer: AudioBuffer | null
  isPlaying: boolean
}

export interface WatermarkOptions {
  type: 'text' | 'image'
  text: string
  color: string
  size: number
  opacity: number
  position: string
}
