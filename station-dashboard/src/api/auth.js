/**
 * src/api/auth.js
 *
 * Auth API service — tambahkan file ini ke folder src/api/ yang sudah ada.
 * Menggunakan apiClient (Axios instance) yang sama dengan stations.js,
 * sehingga Authorization header otomatis disuntikkan oleh interceptor.
 */
import apiClient from './client'

/**
 * POST /auth/login
 * @param {{ username: string, password: string }} credentials
 * @returns {{ access_token, token_type, user }}
 */
export const login = ({ username, password }) =>
  apiClient.post('/auth/login', {
    username_or_email: username,
    password,
  })

/**
 * POST /auth/register
 * @param {{ username, email, password, full_name? }} payload
 */
export const register = (payload) =>
  apiClient.post('/auth/register', payload)

/**
 * GET /auth/me — ambil data user yang sedang login
 * Header Authorization otomatis disertakan oleh interceptor Axios
 */
export const getMe = () =>
  apiClient.get('/auth/me')

/**
 * POST /auth/forgot-password
 * @param {{ email: string }} payload
 */
export const forgotPassword = (payload) =>
  apiClient.post('/auth/forgot-password', payload)

/**
 * POST /auth/reset-password
 * @param {{ token: string, new_password: string }} payload
 */
export const resetPassword = (payload) =>
  apiClient.post('/auth/reset-password', payload)

// ─── User management (admin & superadmin only) ────────────────────────────

/**
 * GET /users — daftar semua user
 */
export const getUsers = () =>
  apiClient.get('/users/')

/**
 * PATCH /users/:id/role
 * @param {string|number} id
 * @param {{ role: 'user'|'admin'|'superadmin' }} payload
 */
export const updateUserRole = (id, payload) =>
  apiClient.patch(`/users/${id}/role`, payload)

/**
 * PATCH /users/:id/active
 * @param {string|number} id
 * @param {{ is_active: boolean }} payload
 */
export const updateUserActive = (id, payload) =>
  apiClient.patch(`/users/${id}/active`, payload)
