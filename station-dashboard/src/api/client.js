import axios from 'axios'
import { BASE_URL } from '@/constants/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - bisa tambah auth token di sini
apiClient.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - global error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      'Terjadi kesalahan pada server'

    console.error('[API Error]', error.config?.url, message)
    return Promise.reject(new Error(message))
  }
)

export default apiClient
