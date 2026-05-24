export function formatInr(n, decimals = 2) {
  const num = Number(n ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals > 0 ? 0 : 0,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatInrPlain(n) {
  return `₹${Number(n ?? 0).toLocaleString('en-IN')}`
}
