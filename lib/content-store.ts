export type GeneratedImage = {
  id: string
  name: string
  imageUrl: string
  prompt: string
  model: string
  aspectRatio: string
  resolution: string
  batchId: string
  duration: number
  createdAt: string
  expiresAt: string
  locked: boolean
}

export type QueueStats = {
  pending: number
  processing: number
  completedToday: number
  errorsToday: number
  lastUpdated: string
}

const IMAGES_KEY = 'ytf_crm_images'
const QUEUE_KEY = 'ytf_crm_queue'

export function getImages(): GeneratedImage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(IMAGES_KEY)
    if (!stored) return []
    const items: GeneratedImage[] = JSON.parse(stored)
    const now = new Date()
    return items.filter(item => item.locked || new Date(item.expiresAt) > now)
  } catch { return [] }
}

export function saveImages(images: GeneratedImage[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(IMAGES_KEY, JSON.stringify(images))
}

export function addImages(newImages: GeneratedImage[]): void {
  saveImages([...newImages, ...getImages()])
}

export function updateImage(id: string, updates: Partial<GeneratedImage>): void {
  saveImages(getImages().map(img => img.id === id ? { ...img, ...updates } : img))
}

export function removeImage(id: string): void {
  saveImages(getImages().filter(img => img.id !== id))
}

export function clearTrail(): void {
  saveImages(getImages().map(img => ({
    ...img, prompt: '', model: '', aspectRatio: '', resolution: '', batchId: '',
  })))
}

export function getQueueStats(): QueueStats {
  if (typeof window === 'undefined') return { pending: 0, processing: 0, completedToday: 0, errorsToday: 0, lastUpdated: new Date().toISOString() }
  try {
    const stored = localStorage.getItem(QUEUE_KEY)
    return stored ? JSON.parse(stored) : { pending: 0, processing: 0, completedToday: 0, errorsToday: 0, lastUpdated: new Date().toISOString() }
  } catch { return { pending: 0, processing: 0, completedToday: 0, errorsToday: 0, lastUpdated: new Date().toISOString() } }
}

export function saveQueueStats(stats: QueueStats): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(QUEUE_KEY, JSON.stringify(stats))
}
