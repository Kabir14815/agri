import { useEffect, useState } from 'react'
import { FiCheckCircle, FiSmile, FiX } from 'react-icons/fi'
import { api } from '../api.js'
import { useDashboard } from '../context/DashboardContext.jsx'

const WELCOME_KEY = 'kgf_dashboard_welcome'

export default function DashboardGreetings() {
  const { data, refresh } = useDashboard()
  const [welcome, setWelcome] = useState(null)
  const [dismissing, setDismissing] = useState(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WELCOME_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.name) setWelcome(parsed)
      sessionStorage.removeItem(WELCOME_KEY)
    } catch {
      sessionStorage.removeItem(WELCOME_KEY)
    }
  }, [])

  const dismissWelcome = () => setWelcome(null)

  const dismissNotification = async (id) => {
    setDismissing(id)
    try {
      await api.dismissNotification(id)
      await refresh({ silent: true })
    } catch {
      /* keep banner visible if dismiss fails */
    } finally {
      setDismissing(null)
    }
  }

  const notifications = data?.notifications || []
  const hasBanners = welcome || notifications.length > 0
  if (!hasBanners) return null

  return (
    <div className="mlm-greetings">
      {welcome && (
        <div className="mlm-greeting-banner mlm-greeting-welcome">
          <FiSmile className="mlm-greeting-icon" aria-hidden />
          <div className="mlm-greeting-body">
            <strong>Welcome back, {welcome.name}!</strong>
            <p>
              We&apos;re glad to see you. Your dashboard is ready — check your wallets,
              team, and latest updates below.
            </p>
          </div>
          <button
            type="button"
            className="mlm-greeting-dismiss"
            onClick={dismissWelcome}
            aria-label="Dismiss welcome message"
          >
            <FiX />
          </button>
        </div>
      )}

      {notifications.map((note) => (
        <div key={note.id} className="mlm-greeting-banner mlm-greeting-success">
          <FiCheckCircle className="mlm-greeting-icon" aria-hidden />
          <div className="mlm-greeting-body">
            <strong>{note.title}</strong>
            <p>{note.message}</p>
          </div>
          <button
            type="button"
            className="mlm-greeting-dismiss"
            onClick={() => dismissNotification(note.id)}
            disabled={dismissing === note.id}
            aria-label="Dismiss notification"
          >
            <FiX />
          </button>
        </div>
      ))}
    </div>
  )
}
