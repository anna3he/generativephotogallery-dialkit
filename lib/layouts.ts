export interface Tile {
  x: number
  y: number
  size: number
  angle: number
  imageIndex: number
  baseAngle?: number
  baseRadius?: number
  ringIndex?: number
  theta?: number
  phi?: number
  depth?: number
  cubeVertex?: { x: number; y: number; z: number }
  // store raw 3D position for renderer to rotate
  rawX?: number
  rawY?: number
  rawZ?: number
}

export interface LayoutParams {
  count: number
  spread: number
  size: number
  radius?: number
  chaos?: number
  speed?: number
}

const GOLDEN_ANGLE = 2.39996

// spread=1 now feels spacious — multipliers tuned so default looks like old spread=5
const SPREAD_SCALE = {
  spiral: 140,  // was 28, now 5x bigger
  orbit:  220,  // orbit ring radius multiplier
  globe:  800,  // was 160, now 5x
  cube:   260,  // was 52, now 5x
}

const SIZE_SCALE = {
  spiral: 0.55,
  orbit:  0.50,
  globe:  0.50,
  cube:   0.70,
}

export function spiralLayout(params: LayoutParams): Tile[] {
  const { count, spread, size, chaos = 0 } = params
  const n = Math.max(count, 24)
  const baseSpread = spread * SPREAD_SCALE.spiral
  const tiles: Tile[] = []

  for (let i = 0; i < n; i++) {
    const angle = i * GOLDEN_ANGLE
    const radius = baseSpread * Math.sqrt(i)
    const scaledSize = size * SIZE_SCALE.spiral * (0.4 + (i / n) * 0.6)
    tiles.push({
      x: Math.cos(angle) * radius + (Math.random() - 0.5) * chaos * 60,
      y: Math.sin(angle) * radius + (Math.random() - 0.5) * chaos * 60,
      size: scaledSize * (1 + (Math.random() - 0.5) * chaos * 0.4),
      angle: (Math.random() - 0.5) * chaos * 0.6,
      imageIndex: i,
      baseAngle: angle,
      baseRadius: radius,
    })
  }
  return tiles
}

export function orbitLayout(params: LayoutParams): Tile[] {
  const { count, spread, size, chaos = 0 } = params
  const n = Math.max(count, 16)
  const tiles: Tile[] = []
  const rings = Math.max(1, Math.round(1 + spread * 3))
  let placed = 0

  for (let r = 0; r < rings && placed < n; r++) {
    const radius = r === 0 ? 0 : (r / rings) * spread * SPREAD_SCALE.orbit + spread * 60
    const actualPerRing = Math.min(
      r === 0 ? 1 : Math.round(6 + r * 4),
      n - placed
    )
    for (let i = 0; i < actualPerRing && placed < n; i++) {
      const angle = (i / actualPerRing) * Math.PI * 2 + r * 0.5
      const actualAngle = angle + (Math.random() - 0.5) * chaos * 0.3
      const actualRadius = Math.max(0, radius + (Math.random() - 0.5) * chaos * radius * 0.3)
      tiles.push({
        x: Math.cos(actualAngle) * actualRadius,
        y: Math.sin(actualAngle) * actualRadius,
        size: size * SIZE_SCALE.orbit * (1 + (Math.random() - 0.5) * chaos * 0.4),
        angle: (Math.random() - 0.5) * chaos * 0.5,
        imageIndex: placed,
        baseAngle: angle,
        baseRadius: actualRadius,
        ringIndex: r,
      })
      placed++
    }
  }
  return tiles
}

export function globeLayout(params: LayoutParams): Tile[] {
  const { count, spread, size, chaos = 0 } = params
  const n = Math.max(count, 20)
  const tiles: Tile[] = []
  const radius = spread * SPREAD_SCALE.globe
  const goldenRatio = (1 + Math.sqrt(5)) / 2

  for (let i = 0; i < n; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
    const finalTheta = theta + (Math.random() - 0.5) * chaos * 0.5
    const finalPhi = phi + (Math.random() - 0.5) * chaos * 0.3

    const x = radius * Math.sin(finalPhi) * Math.cos(finalTheta)
    const y = radius * Math.cos(finalPhi)
    const z = radius * Math.sin(finalPhi) * Math.sin(finalTheta)
    const depth = z / radius

    tiles.push({
      x, y,
      size: size * SIZE_SCALE.globe * (0.7 + (depth + 1) * 0.2) * (1 + (Math.random() - 0.5) * chaos * 0.3),
      angle: (Math.random() - 0.5) * chaos * 0.4,
      imageIndex: i,
      theta: finalTheta,
      phi: finalPhi,
      depth,
    })
  }

  tiles.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))
  return tiles
}

/** Max cube side length (7×7×7 = 343 tiles) */
export const CUBE_MAX_SIDE = 7
export const CUBE_MAX_COUNT = CUBE_MAX_SIDE ** 3

export interface CubeGridDimensions {
  nx: number
  ny: number
  nz: number
  volume: number
}

/**
 * Map count → perfect cube side length (1³, 2³, 3³ … up to 7³).
 * Steps up at midpoints between cube volumes so growth feels gradual.
 */
export function cubeSideLength(count: number): number {
  const n = Math.max(1, Math.min(CUBE_MAX_COUNT, Math.round(count)))
  for (let side = CUBE_MAX_SIDE; side >= 2; side--) {
    const prev = (side - 1) ** 3
    const curr = side ** 3
    const threshold = Math.ceil((prev + curr) / 2)
    if (n >= threshold) return side
  }
  return 1
}

export function cubeGridDimensions(count: number): CubeGridDimensions {
  const side = cubeSideLength(count)
  return { nx: side, ny: side, nz: side, volume: side ** 3 }
}

export function cubeGridSize(count: number): number {
  return cubeSideLength(count)
}

export function cubeLayout(params: LayoutParams): Tile[] {
  const { count, spread, size, chaos = 0 } = params
  const tiles: Tile[] = []

  const gridSize = cubeSideLength(count)
  const step = spread * SPREAD_SCALE.cube
  const halfGrid = (gridSize - 1) / 2

  let placed = 0
  for (let xi = 0; xi < gridSize; xi++) {
    for (let yi = 0; yi < gridSize; yi++) {
      for (let zi = 0; zi < gridSize; zi++) {
        const rx = (xi - halfGrid) * step + (Math.random() - 0.5) * chaos * 10
        const ry = (yi - halfGrid) * step + (Math.random() - 0.5) * chaos * 10
        const rz = (zi - halfGrid) * step + (Math.random() - 0.5) * chaos * 10

        tiles.push({
          x: rx,
          y: ry,
          size: size * SIZE_SCALE.cube,
          angle: (Math.random() - 0.5) * chaos * 0.3,
          imageIndex: placed,
          rawX: rx,
          rawY: ry,
          rawZ: rz,
          depth: rz,
        })
        placed++
      }
    }
  }

  tiles.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))
  return tiles
}

export type ShapeType = 'spiral' | 'orbit' | 'globe' | 'cube'

export function computeLayout(shape: ShapeType, params: LayoutParams): Tile[] {
  switch (shape) {
    case 'spiral': return spiralLayout(params)
    case 'orbit':  return orbitLayout(params)
    case 'globe':  return globeLayout(params)
    case 'cube':   return cubeLayout(params)
  }
}
