import { createContext, useCallback, useContext, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiHelpCircle, FiX, FiTrash2 } from 'react-icons/fi'

const AdminDialogContext = createContext(null)

const VARIANTS = {
  primary: { icon: FiHelpCircle, ring: '#22c55e', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
  success: { icon: FiCheckCircle, ring: '#22c55e', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
  danger: { icon: FiAlertCircle, ring: '#ef4444', bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)' },
  warning: { icon: FiAlertCircle, ring: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
  info: { icon: FiHelpCircle, ring: '#3b82f6', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
}

function DialogView({ dialog, onClose }) {
  if (!dialog) return null

  const variant = VARIANTS[dialog.variant] || VARIANTS.primary
  const Icon = dialog.icon || variant.icon
  const isConfirm = dialog.mode === 'confirm'

  const handleConfirm = () => {
    dialog.resolve?.(true)
    onClose()
  }

  const handleCancel = () => {
    dialog.resolve?.(false)
    onClose()
  }

  const handleOk = () => {
    dialog.resolve?.(true)
    onClose()
  }

  return (
    <div
      className="admin-dialog-backdrop"
      role="presentation"
      onClick={
        dialog.dismissOnBackdrop !== false
          ? isConfirm
            ? handleCancel
            : handleOk
          : undefined
      }
    >
      <div
        className={`admin-dialog admin-dialog--${dialog.variant || 'primary'}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="admin-dialog-close"
          onClick={isConfirm ? handleCancel : handleOk}
          aria-label="Close"
        >
          <FiX />
        </button>

        <div className="admin-dialog-icon-wrap" style={{ background: variant.bg }}>
          <span className="admin-dialog-icon-ring" style={{ borderColor: variant.ring }}>
            <Icon style={{ color: variant.ring }} />
          </span>
        </div>

        <div className="admin-dialog-body">
          <h3 id="admin-dialog-title">{dialog.title}</h3>
          {dialog.message && <p>{dialog.message}</p>}
          {dialog.detail && <p className="admin-dialog-detail">{dialog.detail}</p>}
        </div>

        <div className="admin-dialog-actions">
          {isConfirm ? (
            <>
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                {dialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${dialog.variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirm}
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleOk}>
              {dialog.okLabel || 'OK'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const close = useCallback(() => setDialog(null), [])

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({
          mode: 'confirm',
          variant: options.variant || 'primary',
          title: options.title || 'Please confirm',
          message: options.message,
          detail: options.detail,
          confirmLabel: options.confirmLabel,
          cancelLabel: options.cancelLabel,
          icon: options.icon,
          dismissOnBackdrop: options.dismissOnBackdrop,
          resolve,
        })
      }),
    [],
  )

  const alert = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({
          mode: 'alert',
          variant: options.variant || 'info',
          title: options.title || 'Notice',
          message: typeof options === 'string' ? options : options.message,
          detail: options.detail,
          okLabel: options.okLabel,
          icon: options.icon,
          resolve,
        })
      }),
    [],
  )

  const success = useCallback(
    (message, title = 'Success') => alert({ title, message, variant: 'success' }),
    [alert],
  )

  const error = useCallback(
    (message, title = 'Something went wrong') => alert({ title, message, variant: 'danger' }),
    [alert],
  )

  return (
    <AdminDialogContext.Provider value={{ confirm, alert, success, error }}>
      {children}
      <DialogView dialog={dialog} onClose={close} />
    </AdminDialogContext.Provider>
  )
}

export function useAdminDialog() {
  const ctx = useContext(AdminDialogContext)
  if (!ctx) {
    throw new Error('useAdminDialog must be used within AdminDialogProvider')
  }
  return ctx
}

/** Shorthand for delete confirmations */
export function confirmDelete(name, itemLabel = 'item') {
  return {
    title: `Delete ${itemLabel}?`,
    message: `This will permanently remove "${name}". This action cannot be undone.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Keep',
    variant: 'danger',
    icon: FiTrash2,
  }
}
