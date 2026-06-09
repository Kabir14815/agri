import ResourceManager from '../ResourceManager.jsx'

export default function TestimonialsPage() {
  return (
    <ResourceManager
      resource="testimonials"
      title="Testimonials"
      description="Customer quotes shown on the homepage."
      imageField="avatar"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'message', label: 'Message', truncate: true },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'role', label: 'Role', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
        { name: 'avatar', label: 'Avatar / photo', type: 'image' },
      ]}
    />
  )
}
