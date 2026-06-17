import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api.js'
import ResourceManager from '../ResourceManager.jsx'

function calcDiscount(price, originalPrice) {
  const p = Number(price)
  const mrp = Number(originalPrice)
  if (!mrp || mrp <= 0 || !p || p >= mrp) return 0
  return Math.round((1 - p / mrp) * 100)
}

export default function ProductsPage() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
  }, [])

  const fields = useMemo(
    () => [
      { name: 'name', label: 'Product name', required: true, fullWidth: true, placeholder: 'e.g. Bhumi Care' },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        options: categories,
        required: true,
        fullWidth: true,
        hint: categories.length === 0 ? 'Loading categories…' : 'Choose the product line this item belongs to.',
      },
      {
        name: 'price',
        label: 'Selling price (₹)',
        type: 'number',
        required: true,
        min: 0,
        placeholder: '550',
      },
      {
        name: 'original_price',
        label: 'MRP (₹)',
        type: 'number',
        required: true,
        min: 0,
        placeholder: '650',
        hint: 'Original price before discount.',
      },
      {
        name: 'discount',
        label: 'Discount',
        type: 'readonly',
        render: (form) => {
          const pct = calcDiscount(form.price, form.original_price)
          if (!pct) return 'No discount'
          const saved = Number(form.original_price) - Number(form.price)
          return `${pct}% off (saves ₹${saved})`
        },
      },
      { name: 'image', label: 'Product image', type: 'image', fullWidth: true },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        fullWidth: true,
        rows: 6,
        placeholder: 'Dosage, benefits, and usage instructions shown on the public site.',
      },
    ],
    [categories],
  )

  const computeFields = (form) => ({
    discount: calcDiscount(form.price, form.original_price),
  })

  return (
    <ResourceManager
      resource="products"
      title="Products"
      description="Add, edit and remove products shown on the public site."
      imageField="image"
      modalClass="admin-modal--wide"
      formGrid
      fields={fields}
      computeFields={computeFields}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price', render: (v) => `₹${v}` },
        { key: 'original_price', label: 'MRP', render: (v) => `₹${v}` },
        { key: 'discount', label: 'Discount', render: (v) => (v ? `${v}%` : '—') },
        {
          key: 'description',
          label: 'Description',
          truncate: true,
          render: (v) => (v ? (v.length > 60 ? `${v.slice(0, 60)}…` : v) : '—'),
        },
      ]}
    />
  )
}
