import { tools } from '@/data/toolsRegistry'
import type { ToolMeta } from '@/types/tools'

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function searchTools(query: string): ToolMeta[] {
  if (!query.trim()) return []

  const normalized = normalizeString(query)

  return tools.filter(tool => {
    const titleNorm = normalizeString(tool.title)
    const descriptionNorm = normalizeString(tool.description)

    return titleNorm.includes(normalized) || descriptionNorm.includes(normalized)
  })
}
