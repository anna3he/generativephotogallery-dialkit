import type { DialConfig } from 'dialkit'
import type { LayoutParams } from '@/lib/layout-params'
import { CUBE_MAX_COUNT } from '@/lib/layouts'

export const layoutDialConfig = {
  count: [12, 1, CUBE_MAX_COUNT] as [number, number, number],
  spread: [1, 0.2, 5] as [number, number, number],
  size: [1, 0.3, 3] as [number, number, number],
  radius: [1, 0, 24] as [number, number, number],
  speed: [1, 0, 3] as [number, number, number],
} satisfies DialConfig

/** Hidden actions so the Shape panel exists; UI is the injected 2x2 grid */
export const shapeDialConfig = {
  spiral: { type: 'action' as const, label: 'Spiral' },
  orbit: { type: 'action' as const, label: 'Orbit' },
  globe: { type: 'action' as const, label: 'Globe' },
  cube: { type: 'action' as const, label: 'Cube' },
} satisfies DialConfig

export const photosDialConfig = {
  nightMode: false,
  upload: { type: 'action' as const, label: 'Upload images' },
  manage: { type: 'action' as const, label: 'Manage photos' },
  exportPng: { type: 'action' as const, label: 'Export PNG' },
} satisfies DialConfig

export const DIAL_PERSIST = { presets: false }

export const LAYOUT_DIAL_STEPS: Record<
  keyof LayoutParams,
  { min: number; max: number; step: number }
> = {
  count: { min: 1, max: CUBE_MAX_COUNT, step: 1 },
  spread: { min: 0.2, max: 5, step: 0.1 },
  size: { min: 0.3, max: 3, step: 0.1 },
  radius: { min: 0, max: 24, step: 1 },
  speed: { min: 0, max: 3, step: 0.1 },
}
