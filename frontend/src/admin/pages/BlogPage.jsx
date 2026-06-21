import ResourceManager from '../ResourceManager.jsx'

export default function BlogPage() {
  return (
    <ResourceManager
      resource="blog"
      title="Blog Posts"
      description="Articles displayed on the public Blog page."
      imageField="image"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'author', label: 'Author' },
        { key: 'date', label: 'Date' },
        { key: 'excerpt', label: 'Excerpt', truncate: true },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
        { name: 'image', label: 'Cover image', type: 'image' },
        { name: 'date', label: 'Date (YYYY-MM-DD)' },
        { name: 'author', label: 'Author', default: 'Kamauput Team' },
      ]}
    />
  )
}
