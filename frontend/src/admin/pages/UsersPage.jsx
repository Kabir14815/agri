import { useEffect, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { adminApi } from '../../api.js'
import { useAdminAuth } from '../AdminAuth.jsx'

const ROLE_COLORS = {
  admin: '#c2410c',
  franchisee: '#7b3eb1',
  customer: '#1f7a3a',
}

export default function UsersPage() {
  const { user: me } = useAdminAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)

  const load = () => {
    setLoading(true)
    adminApi
      .users()
      .then(setItems)
      .catch((e) => setStatus({ type: 'error', text: e.message }))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const remove = async (u) => {
    if (!confirm(`Delete user "${u.full_name}"?`)) return
    try {
      await adminApi.deleteUser(u.id)
      load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Users</h1>
          <p>Customers, franchisees and admins registered on the platform.</p>
        </div>
      </div>
      {status && <div className={`form-message ${status.type}`}>{status.text}</div>}
      <section className="admin-panel">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th style={{ width: 70 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span
                      className="role-pill"
                      style={{ background: ROLE_COLORS[u.role] || '#475569' }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.id !== me?.id && (
                      <button
                        className="icon-btn danger"
                        onClick={() => remove(u)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
