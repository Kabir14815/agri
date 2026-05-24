/** Netlify proxies /api → Render; local dev uses Vite proxy (vite.config.js) */
const BASE = import.meta.env.VITE_API_URL || '/api'

function authHeader() {
  const token = localStorage.getItem('kgf_admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function userAuthHeader() {
  const token =
    localStorage.getItem('kgf_token') || localStorage.getItem('kgf_franchisee_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  let headers = { 'Content-Type': 'application/json' }
  if (options.auth === true) headers = { ...headers, ...authHeader() }
  else if (options.auth === 'user') headers = { ...headers, ...userAuthHeader() }
  const res = await fetch(`${BASE}${path}`, {
    headers,
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
  lookupReferral: (code) =>
    request(`/referral/lookup?code=${encodeURIComponent(code)}`),
  trackReferralVisit: (data) =>
    request('/referral/track-visit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  userDashboard: () => request('/user/dashboard', { auth: 'user' }),
  getProfile: () => request('/user/profile', { auth: 'user' }),
  updateProfile: (data) =>
    request('/user/profile', {
      method: 'PATCH',
      auth: 'user',
      body: JSON.stringify(data),
    }),
  updateBank: (data) =>
    request('/user/bank', {
      method: 'PATCH',
      auth: 'user',
      body: JSON.stringify(data),
    }),
  changePassword: (data) =>
    request('/user/password', {
      method: 'PATCH',
      auth: 'user',
      body: JSON.stringify(data),
    }),
  getReferralTree: (memberId) =>
    request(
      `/user/referral-tree${memberId ? `?member_id=${encodeURIComponent(memberId)}` : ''}`,
      { auth: 'user' },
    ),
  listDeposits: () => request('/user/deposits', { auth: 'user' }),
  createDeposit: (data) =>
    request('/user/deposits', {
      method: 'POST',
      auth: 'user',
      body: JSON.stringify(data),
    }),
  getWallet: () => request('/user/wallet', { auth: 'user' }),
  getWalletStatement: (wallet) =>
    request(
      `/user/wallet/statement${wallet ? `?wallet=${encodeURIComponent(wallet)}` : ''}`,
      { auth: 'user' },
    ),
  getActivateStatus: () => request('/user/activate', { auth: 'user' }),
  getIncomes: () => request('/user/incomes', { auth: 'user' }),
  getTransactions: () => request('/user/transactions', { auth: 'user' }),
  getExchange: () => request('/user/exchange', { auth: 'user' }),
  createExchange: (data) =>
    request('/user/exchange', {
      method: 'POST',
      auth: 'user',
      body: JSON.stringify(data),
    }),
  getHelpDesk: () => request('/user/help-desk', { auth: 'user' }),
  createHelpTicket: (data) =>
    request('/user/help-desk', {
      method: 'POST',
      auth: 'user',
      body: JSON.stringify(data),
    }),
  getReferralInfo: () => request('/user/referral-info', { auth: 'user' }),
}

// ---------- Admin API ----------

export const adminApi = {
  me: () => request('/admin/me', { auth: true }),
  updateUserAmount: (id, amount) =>
    request(`/admin/users/${id}/amount`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ amount }),
    }),
  stats: () => request('/admin/stats', { auth: true }),
  contacts: () => request('/admin/contacts', { auth: true }),
  deleteContact: (id) =>
    request(`/admin/contacts/${id}`, { method: 'DELETE', auth: true }),
  users: () => request('/admin/users', { auth: true }),
  deleteUser: (id) =>
    request(`/admin/users/${id}`, { method: 'DELETE', auth: true }),
  deposits: () => request('/admin/deposits', { auth: true }),
  updateDeposit: (id, status) =>
    request(`/admin/deposits/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status }),
    }),
  getUserReferrals: (userId) =>
    request(`/admin/users/${userId}/referrals`, { auth: true }),
  getUserReferralTree: (userId, memberId) =>
    request(
      `/admin/users/${userId}/referral-tree${memberId ? `?member_id=${encodeURIComponent(memberId)}` : ''}`,
      { auth: true },
    ),
  referrals: () => request('/admin/referrals', { auth: true }),
  referralVisits: () => request('/admin/referral-visits', { auth: true }),
  updateUserMlm: (userId, data) =>
    request(`/admin/users/${userId}/mlm`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    }),
  helpDesk: () => request('/admin/help-desk', { auth: true }),
  replyHelpTicket: (id, data) =>
    request(`/admin/help-desk/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    }),
  exchanges: () => request('/admin/exchange', { auth: true }),
  updateExchange: (id, status) =>
    request(`/admin/exchange/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status }),
    }),

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
