import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="not-found">
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </section>
  )
}
