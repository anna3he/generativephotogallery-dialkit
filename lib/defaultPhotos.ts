/** Add or reorder paths under public/samples/ (loaded on first visit) */
export const DEFAULT_PHOTO_PATHS = [
  '/samples/photo-01.jpg',
  '/samples/photo-02.jpg',
  '/samples/photo-03.jpg',
  '/samples/photo-04.jpg',
  '/samples/photo-05.jpg',
  '/samples/photo-06.jpg',
  '/samples/photo-07.jpg',
  '/samples/photo-08.jpg',
  '/samples/photo-09.jpg',
  '/samples/photo-10.jpg',
  '/samples/photo-11.jpg',
  '/samples/photo-12.jpg',
  '/samples/photo-13.jpg',
  '/samples/photo-14.jpg',
  '/samples/photo-15.jpg',
  '/samples/photo-16.jpg',
  '/samples/photo-17.jpg',
  '/samples/photo-18.jpg',
  '/samples/photo-19.jpg',
  '/samples/photo-20.jpg',
  '/samples/photo-21.jpg',
  '/samples/photo-22.jpg',
  '/samples/photo-23.jpg',
] as const

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

export async function loadDefaultPhotos(): Promise<HTMLImageElement[]> {
  const results = await Promise.allSettled(
    DEFAULT_PHOTO_PATHS.map((path) => loadImage(path)),
  )
  return results
    .filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === 'fulfilled')
    .map((r) => r.value)
}
