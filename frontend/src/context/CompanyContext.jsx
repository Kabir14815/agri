import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api.js'

const CompanyContext = createContext(null)

const FALLBACK = {
  name: 'Kamauput Growth Farming',
  full_name: 'Kamauput Growth Farming Pvt Ltd.',
  email: 'info@kgffarming.com',
  phone: '+91 93552 40503',
  address:
    '1133/3, Sheetal Puri Colony, Apollo Road, Jind 126102 — Near Madhur Milan Hotel, Gali No. 03',
  tagline: 'KGF का साथ है तो बदलाव अपने आप है',
  motto: 'जय जवान जय किसान',
  logo: '/brand/logo-sm.png',
  facebook: '',
  twitter: '',
  instagram: '',
  youtube: '',
  whatsapp: '+919355240503',
}

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getCompany()
      .then((data) => setCompany({ ...FALLBACK, ...data }))
      .catch(() => setCompany(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  return (
    <CompanyContext.Provider value={{ company, loading }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) return { company: FALLBACK, loading: false }
  return ctx
}
