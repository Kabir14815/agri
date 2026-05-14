import ResourceManager from '../ResourceManager.jsx'

export default function FaqsPage() {
  return (
    <ResourceManager
      resource="faqs"
      title="FAQs"
      description="Frequently asked questions displayed on the homepage and Why Us page."
      columns={[
        { key: 'question', label: 'Question' },
        { key: 'answer', label: 'Answer', truncate: true },
      ]}
      fields={[
        { name: 'question', label: 'Question', required: true },
        { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      ]}
    />
  )
}
