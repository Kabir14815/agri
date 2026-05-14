import { Link } from 'react-router-dom'

export default function PageBanner({ title, current }) {
  return (
    <section className="page-banner">
      <h1>{title}</h1>
      <div className="breadcrumbs">
        <Link to="/">Home</Link> &nbsp;/&nbsp; <span>{current || title}</span>
      </div>
    </section>
  )
}
