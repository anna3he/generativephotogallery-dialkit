import type { Tile, ShapeType } from './layouts'

export interface RenderState {
  canvas: HTMLCanvasElement
  images: HTMLImageElement[]
  tiles: Tile[]
  panX: number
  panY: number
  zoom: number
  nightMode: boolean
  tileSize: number
  animOffset: number
  speed?: number
  shape?: ShapeType
  spread?: number
  radius?: number
  rotationX?: number
  rotationY?: number
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const cr = Math.min(r, Math.min(w, h) / 2)
  ctx.beginPath()
  ctx.moveTo(x + cr, y)
  ctx.lineTo(x + w - cr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + cr)
  ctx.lineTo(x + w, y + h - cr)
  ctx.quadraticCurveTo(x + w, y + h, x + w - cr, y + h)
  ctx.lineTo(x + cr, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - cr)
  ctx.lineTo(x, y + cr)
  ctx.quadraticCurveTo(x, y, x + cr, y)
  ctx.closePath()
}

export function render(state: RenderState) {
  const {
    canvas, images, tiles, panX, panY, zoom, nightMode,
    tileSize, animOffset, speed = 1, shape = 'spiral', spread = 1, radius = 0,
    rotationX = 0, rotationY = 0,
  } = state
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height

  ctx.fillStyle = nightMode ? '#0a0a0a' : '#f5f4f0'
  ctx.fillRect(0, 0, W, H)

  if (images.length === 0) return

  const t = animOffset * 0.0003 * speed
  const rotY = rotationY + t
  const rotX = rotationX + t * 0.35
  let animatedTiles: (Tile & { _alpha?: number })[] = tiles

  if (shape === 'globe') {
    const r = spread * 800
    animatedTiles = tiles.map((tile) => {
      const theta = (tile.theta ?? 0) + rotY
      const phi = tile.phi ?? Math.PI / 2
      let x = r * Math.sin(phi) * Math.cos(theta)
      let y = r * Math.cos(phi)
      let z = r * Math.sin(phi) * Math.sin(theta)
      // Manual X rotation (tilt)
      const y2 = y * Math.cos(rotX) - z * Math.sin(rotX)
      const z2 = y * Math.sin(rotX) + z * Math.cos(rotX)
      x = x
      y = y2
      z = z2
      const depth = z / r
      const oldScale = 0.7 + ((tile.depth ?? 0) + 1) * 0.2
      const newScale = 0.7 + (depth + 1) * 0.2
      return {
        ...tile, x, y, depth,
        size: tile.size / oldScale * newScale,
        _alpha: 0.35 + (depth + 1) * 0.32,
      }
    }).sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))

  } else if (shape === 'cube') {
    const cubeRotY = rotY * 0.4
    const cubeRotX = rotX * 0.25

    animatedTiles = tiles.map((tile) => {
      // Use stored raw 3D positions — no re-derivation needed
      const rx = tile.rawX ?? tile.x
      const ry = tile.rawY ?? tile.y
      const rz = tile.rawZ ?? 0

      // Rotate Y axis
      const x1 = rx * Math.cos(cubeRotY) - rz * Math.sin(cubeRotY)
      const z1 = rx * Math.sin(cubeRotY) + rz * Math.cos(cubeRotY)
      const y2 = ry * Math.cos(cubeRotX) - z1 * Math.sin(cubeRotX)
      const z2 = ry * Math.sin(cubeRotX) + z1 * Math.cos(cubeRotX)

      const maxDepth = spread * 260
      const alpha = maxDepth > 0 ? 0.5 + (z2 / maxDepth) * 0.5 : 1

      return { ...tile, x: x1, y: y2, depth: z2, _alpha: Math.max(0.2, Math.min(1, alpha)) }
    }).sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))
  }

  ctx.save()
  ctx.translate(W / 2 + panX, H / 2 + panY)
  ctx.scale(zoom, zoom)

  for (let i = 0; i < animatedTiles.length; i++) {
    const tile = animatedTiles[i]
    const img = images[tile.imageIndex % images.length]
    if (!img || !img.complete || !img.naturalWidth) continue

    let drawX = tile.x
    let drawY = tile.y
    let drawAngle = tile.angle
    let alpha = tile._alpha ?? 1

    if (shape === 'spiral' && tile.baseAngle !== undefined && tile.baseRadius !== undefined) {
      const animAngle = tile.baseAngle + rotY * 0.8
      drawX = Math.cos(animAngle) * tile.baseRadius
      drawY = Math.sin(animAngle) * tile.baseRadius
      drawAngle = 0
      alpha = 1
    } else if (shape === 'orbit' && tile.baseAngle !== undefined && tile.baseRadius !== undefined) {
      const ringSpeed = 1 / (1 + (tile.ringIndex ?? 0) * 0.3)
      const animAngle = tile.baseAngle + rotY * ringSpeed
      drawX = Math.cos(animAngle) * tile.baseRadius
      drawY = Math.sin(animAngle) * tile.baseRadius
      drawAngle = 0
      alpha = 1
    }

    const s = tile.size * tileSize
    const hw = s / 2
    const cornerR = Math.min(radius / zoom, hw)

    ctx.save()
    ctx.translate(drawX, drawY)
    ctx.rotate(drawAngle)
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha))

    ctx.beginPath()
    drawRoundedRect(ctx, -hw, -hw, s, s, cornerR)
    ctx.clip()

    ctx.shadowColor = nightMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'
    ctx.shadowBlur = 10 / zoom
    ctx.shadowOffsetY = 3 / zoom

    const imgAR = img.naturalWidth / img.naturalHeight
    let imgW = s, imgH = s, imgX = -hw, imgY = -hw
    if (imgAR > 1) {
      imgH = s; imgW = s * imgAR; imgX = -imgW / 2
    } else {
      imgW = s; imgH = s / imgAR; imgY = -imgH / 2
    }
    ctx.drawImage(img, imgX, imgY, imgW, imgH)

    ctx.globalAlpha = 1
    ctx.restore()
  }

  ctx.restore()
}

export function exportCanvas(
  images: HTMLImageElement[],
  tiles: Tile[],
  panX: number, panY: number,
  zoom: number,
  nightMode: boolean,
  tileSize: number,
  width = 2400, height = 1600,
  shape: ShapeType = 'spiral',
  spread = 1,
  radius = 0,
): string {
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  render({ canvas: offscreen, images, tiles, panX, panY, zoom, nightMode, tileSize, animOffset: 0, shape, spread, radius })
  return offscreen.toDataURL('image/png')
}
