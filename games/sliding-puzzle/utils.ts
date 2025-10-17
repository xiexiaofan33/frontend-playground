export function splitImageArray(
  imageUrl: string,
  cols: number,
  rows: number,
  options?: {
    imageType?: string
    quality?: number
  },
) {
  return new Promise<string[]>((resolve, reject) => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const w = Math.floor(img.width / cols)
        const h = Math.floor(img.height / rows)
        canvas.width = w
        canvas.height = h
        const results = Array.from({ length: w * h }, (_, index) => {
          const x = index % cols
          const y = Math.floor(index / cols)
          ctx?.drawImage(img, x * w, y * h, w, h, 0, 0, w, h)
          return canvas.toDataURL(options?.imageType, options?.quality)
        })
        resolve(results)
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }
    img.onerror = e => {
      const msg = e instanceof Event ? e.type : e
      reject(new Error(`图片加载失败: ${msg}`))
    }
  })
}
