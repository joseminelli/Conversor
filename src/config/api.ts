// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  endpoints: {
    youtube: {
      info: `${API_BASE_URL}/api/youtube/info`,
      download: `${API_BASE_URL}/api/youtube/download`,
      formats: `${API_BASE_URL}/api/youtube/formats`
    },
    instagram: {
      info: `${API_BASE_URL}/api/instagram/info`,
      download: `${API_BASE_URL}/api/instagram/download`
    }
  }
}
