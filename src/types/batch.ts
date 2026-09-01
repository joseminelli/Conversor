export type BatchItemStatus = 'queued' | 'processing' | 'done' | 'error'

export interface ImageDimensions {
  width: number
  height: number
}

export interface BatchItem {
  id: string
  name: string
  file: File
  thumbnail?: string
  originalDimensions?: ImageDimensions
  status: BatchItemStatus
  progress: number
  resultSize?: number
  error?: string
}
