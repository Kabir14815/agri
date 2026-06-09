import ResourceManager from '../ResourceManager.jsx'

export default function ServicesPage() {
  return (
    <ResourceManager
      resource="services"
      title="Services"
      description="The 3-card services block on the homepage."
      imageField="image"
      columns={[
        { key: 'number', label: '#' },
        { key: 'title', label: 'Title' },
        { key: 'subtitle', label: 'Subtitle' },
        { key: 'description', label: 'Description', truncate: true },
      ]}
      fields={[
        { name: 'number', label: 'Number (e.g. 01)', required: true },
        { name: 'title', label: 'Title', required: true },
        { name: 'subtitle', label: 'Subtitle', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'image', label: 'Service image', type: 'image' },
      ]}
    />
  )
}
