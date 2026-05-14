const BASE = '/api'

function authHeader() {
  const token = localStorage.getItem('kgf_admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.auth ? authHeader() : {}) },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getProducts: (category) =>
    request(`/products${category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : ''}`),
  getCategories: () => request('/categories'),
  getServices: () => request('/services'),
  getFaqs: () => request('/faqs'),
  getTestimonials: () => request('/testimonials'),
  getProjects: () => request('/projects'),
  getAchievers: () => request('/achievers'),
  getBlog: () => request('/blog'),
  getBlogPost: (id) => request(`/blog/${id}`),
  getCompany: () => request('/company'),
  submitContact: (data) =>
    request('/contact', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
}

// ---------- Admin API ----------

export const adminApi = {
  me: () => request('/admin/me', { auth: true }),
  stats: () => request('/admin/stats', { auth: true }),
  contacts: () => request('/admin/contacts', { auth: true }),
  deleteContact: (id) =>
    request(`/admin/contacts/${id}`, { method: 'DELETE', auth: true }),
  users: () => request('/admin/users', { auth: true }),
  deleteUser: (id) =>
    request(`/admin/users/${id}`, { method: 'DELETE', auth: true }),

  // Generic CRUD
  list: (resource) => request(`/${resource}`),
  create: (resource, data) =>
    request(`/admin/${resource}`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    }),
  update: (resource, id, data) =>
    request(`/admin/${resource}/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(data),
    }),
  remove: (resource, id) =>
    request(`/admin/${resource}/${id}`, { method: 'DELETE', auth: true }),
}
