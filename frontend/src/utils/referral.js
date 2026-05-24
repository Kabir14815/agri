const STORAGE_KEY = 'kgf_referral_code'
const SESSION_FLAG = 'kgf_referral_session'

/** Normalize referral / member id from user input or URL */
export function normalizeReferralCode(raw) {
  if (!raw) return ''
  return String(raw).trim().toUpperCase().replace(/\s+/g, '')
}

/** Member id from /ref/CODE, /join/CODE, or /register/ref/CODE */
export function referralCodeFromPathname(pathname) {
  const m = String(pathname || '').match(/^\/(?:ref|join|register\/ref)\/([^/?#]+)/i)
  return m ? normalizeReferralCode(m[1]) : ''
}

/** Read ref from current URL search params */
export function getRefFromSearchParams(searchParams) {
  const keys = ['ref', 'referral', 'sponsor', 'code']
  for (const key of keys) {
    const val = searchParams.get(key)
    if (val) return normalizeReferralCode(val)
  }
  return ''
}

export function persistReferralCode(code) {
  const normalized = normalizeReferralCode(code)
  if (!normalized) return ''
  try {
    localStorage.setItem(STORAGE_KEY, normalized)
    sessionStorage.setItem(STORAGE_KEY, normalized)
    sessionStorage.setItem(SESSION_FLAG, '1')
  } catch {
    /* private browsing */
  }
  return normalized
}

export function hasActiveReferralSession() {
  try {
    return sessionStorage.getItem(SESSION_FLAG) === '1'
  } catch {
    return false
  }
}

export function getStoredReferralCode() {
  try {
    return (
      sessionStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(STORAGE_KEY) ||
      ''
    )
  } catch {
    return ''
  }
}

export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(SESSION_FLAG)
  } catch {
    /* ignore */
  }
}

/** Referral from current URL only (no stale storage) — use for login banners */
export function resolveReferralCodeFromUrl(searchParams, routeCode, pathname = '') {
  const fromRoute = normalizeReferralCode(routeCode)
  if (fromRoute) return persistReferralCode(fromRoute)
  const fromUrl = getRefFromSearchParams(searchParams)
  if (fromUrl) return persistReferralCode(fromUrl)
  const fromPath = referralCodeFromPathname(pathname)
  if (fromPath) return persistReferralCode(fromPath)
  return ''
}

/**
 * Referral for registration: current URL first, then stored code only if the
 * user opened a referral link this browser session (supports many sponsors).
 */
export function resolveReferralCode(searchParams, routeCode, pathname = '') {
  const fromUrl = resolveReferralCodeFromUrl(searchParams, routeCode, pathname)
  if (fromUrl) return fromUrl
  if (hasActiveReferralSession()) return getStoredReferralCode()
  return ''
}

export function buildRegisterPath(code) {
  const c = normalizeReferralCode(code)
  return c ? `/register?ref=${encodeURIComponent(c)}` : '/register'
}

export function buildLoginPath(code) {
  const c = normalizeReferralCode(code)
  return c ? `/login?ref=${encodeURIComponent(c)}` : '/login'
}

export function buildReferralShareUrl(siteBase, memberId) {
  const base = (siteBase || window.location.origin).replace(/\/$/, '')
  const code = normalizeReferralCode(memberId)
  return `${base}/ref/${code}`
}
