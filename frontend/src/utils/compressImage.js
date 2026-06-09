const MAX_EDGE = 1280
const JPEG_QUALITY = 0.72

/**
 * Compress an image file and return a base64 data-URL string.
 * Used for admin content images stored directly in MongoDB as strings.
 * Defaults to smaller settings than daily-log uploads to keep DB docs lean.
 * @returns {Promise<string>} data URL
 */
export function compressImageToDataUrl(file, { maxEdge = 800, quality = 0.65 } = {}) {
  if (!file?.type?.startsWith('image/')) {
    return Promise.reject(new Error('Please choose an image file (JPG, PNG, WebP…).'))
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const scale = Math.min(1, maxEdge / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Could not process image')); return }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image file')) }
    img.src = url
  })
}

/**
 * Resize/compress a photo in the browser before upload (smaller payload).
 * @returns {Promise<File>}
 */
export function compressImageFile(file, { maxEdge = MAX_EDGE, quality = JPEG_QUALITY } = {}) {
  if (!file?.type?.startsWith('image/')) {
    return Promise.reject(new Error('Please choose a photo (JPG or PNG).'))
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const scale = Math.min(1, maxEdge / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not process image'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not compress image'))
            return
          }
          const name = file.name.replace(/\.\w+$/, '') || 'farm-photo'
          resolve(new File([blob], `${name}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }))
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Invalid image file'))
    }
    img.src = url
  })
}
