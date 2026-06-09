import ResourceManager from '../ResourceManager.jsx'

export default function AchieversPage() {
  return (
    <ResourceManager
      resource="achievers"
      title="Achievers"
      description="Top distributors / franchisees shown on the Achievers page."
      imageField="avatar"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'title', label: 'Title' },
        { key: 'location', label: 'Location' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'title', label: 'Title / Rank', required: true },
        { name: 'location', label: 'Location', required: true },
        { name: 'avatar', label: 'Avatar / photo', type: 'image' },
      ]}
    />
  )
}
