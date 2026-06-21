import { Link } from 'react-router-dom'
import { BRAND } from '../constants/brand.js'

const LOGO_SIZES = {
  navbar: { w: 52, h: 52, src: BRAND.logo },
  footer: { w: 56, h: 56, src: BRAND.logo },
  admin: { w: 46, h: 46, src: BRAND.logo },
  dashboard: { w: 44, h: 44, src: BRAND.logo },
  auth: { w: 110, h: 110, src: BRAND.logoFull },
}

export default function BrandLogo({
  variant = 'navbar',
  to = '/',
  showText = true,
  className = '',
  asLink = true,
  light = false,
  onClick,
}) {
  const title =
    variant === 'admin'
      ? `${BRAND.shortName} Admin`
      : variant === 'dashboard'
        ? BRAND.shortName
        : BRAND.name

  const { w, h, src } = LOGO_SIZES[variant] || LOGO_SIZES.navbar
  const eager = variant === 'navbar'

  const content = (
    <>
      <img
        src={src}
        alt={BRAND.name}
        className={`brand-logo-img brand-logo-img--${variant}`}
        width={w}
        height={h}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        loading={eager ? 'eager' : 'lazy'}
      />
      {showText && (
        <div className="brand-text">
          <div className={`brand-name${light ? ' brand-name--light' : ''}`}>{title}</div>
          {(variant === 'navbar' || variant === 'footer') && (
            <div className={`brand-sub${light ? ' brand-sub--light' : ''}`}>{BRAND.fullName}</div>
          )}
          {variant === 'admin' && (
            <small className={`brand-sub${light ? ' brand-sub--light' : ''}`}>Control Panel</small>
          )}
          {variant === 'dashboard' && (
            <span className="brand-sub brand-sub--light">{BRAND.fullName}</span>
          )}
        </div>
      )}
    </>
  )

  const wrapClass = `brand brand--${variant} ${className}`.trim()

  if (asLink && to) {
    return (
      <Link to={to} className={wrapClass} aria-label={`${BRAND.name} home`} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return <div className={wrapClass}>{content}</div>
}

export function AuthBrandHeader() {
  return (
    <div className="auth-brand-header">
      <BrandLogo variant="auth" showText={false} asLink={false} />
      <p className="auth-brand-name">{BRAND.name}</p>
      <p className="auth-brand-tagline">{BRAND.tagline}</p>
    </div>
  )
}
