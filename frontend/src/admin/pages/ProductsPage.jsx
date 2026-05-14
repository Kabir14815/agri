import ResourceManager from '../ResourceManager.jsx'

export default function ProductsPage() {
  return (
    <ResourceManager
      resource="products"
      title="Products"
      description="Add, edit and remove products shown on the public site."
      imageField="image"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price', render: (v) => `₹${v}` },
        { key: 'original_price', label: 'MRP', render: (v) => `₹${v}` },
        { key: 'discount', label: 'Discount', render: (v) => `${v}%` },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'category', label: 'Category (AGRICULTURE / VERMI COMPOST / INSECTICIDE / GROWTH BOOSTER)', required: true },
        { name: 'price', label: 'Price (₹)', type: 'number', required: true },
        { name: 'original_price', label: 'Original price / MRP (₹)', type: 'number', required: true },
        { name: 'discount', label: 'Discount (%)', type: 'number' },
        { name: 'image', label: 'Image URL' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
    />
  )
}
