// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  endpoints: {
    youtube: {
      info: `${API_BASE_URL}/youtube/info`,
      download: `${API_BASE_URL}/youtube/download`,
      stream: `${API_BASE_URL}/youtube/stream`,
      formats: `${API_BASE_URL}/youtube/formats`
    },
    instagram: {
      info: `${API_BASE_URL}/instagram/info`,
      download: `${API_BASE_URL}/instagram/download`
    }
  }
}
