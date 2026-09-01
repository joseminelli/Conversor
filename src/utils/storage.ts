const STORAGE_KEY_FAVORITES = 'conversor_favorites'
const STORAGE_KEY_RECENTS = 'conversor_recents'
const MAX_RECENTS = 5

function isBrowserLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

export function pushRecentTool(toolId: string): void {
  if (!isBrowserLocalStorageAvailable()) return

  try {
    const recents = getRecentTools()
    const filtered = recents.filter(id => id !== toolId)
    const updated = [toolId, ...filtered].slice(0, MAX_RECENTS)
    localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(updated))
  } catch {
    console.error('Failed to update recent tools in localStorage.')
  }
}

export function getRecentTools(): string[] {
  if (!isBrowserLocalStorageAvailable()) return []

  try {
    const data = localStorage.getItem(STORAGE_KEY_RECENTS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getFavorites(): string[] {
  if (!isBrowserLocalStorageAvailable()) return []

  try {
    const data = localStorage.getItem(STORAGE_KEY_FAVORITES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function toggleFavorite(toolId: string): void {
  if (!isBrowserLocalStorageAvailable()) return

  try {
    const favorites = getFavorites()
    const index = favorites.indexOf(toolId)

    if (index > -1) {
      favorites.splice(index, 1)
    } else {
      favorites.push(toolId)
    }

    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites))
  } catch {
    console.error('Failed to toggle favorite in localStorage.')
  }
}

export function isFavorite(toolId: string): boolean {
  return getFavorites().includes(toolId)
}
