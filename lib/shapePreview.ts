export type PreviewShape = 'spiral' | 'orbit' | 'globe' | 'cube'
export type PreviewTheme = 'app' | 'dialkit'

function d(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  r: number, alpha: number,
  color: string
) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  ctx.fill()
}

function previewPalette(theme: PreviewTheme, nightMode: boolean) {
  if (theme === 'dialkit') {
    return {
      bg: 'rgba(255, 255, 255, 0.08)',
      fg: 'rgba(255, 255, 255, 0.52)',
      fgStrong: 'rgba(255, 255, 255, 0.72)',
      fgSoft: 'rgba(255, 255, 255, 0.34)',
    }
  }
  return {
    bg: nightMode ? '#252525' : '#EBEBEB',
    fg: nightMode ? '#CCCCCC' : '#444444',
    fgStrong: nightMode ? '#E8E8E8' : '#333333',
    fgSoft: nightMode ? '#888888' : '#767676',
  }
}

export function drawShapePreview(
  canvas: HTMLCanvasElement,
  shape: PreviewShape,
  nightMode: boolean,
  dpr = 1,
  size = 44,
  theme: PreviewTheme = 'app',
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const scale = size / 44
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)

  const S = 44
  const cx = S / 2
  const cy = S / 2
  const palette = previewPalette(theme, nightMode)

  ctx.clearRect(0, 0, S, S)

  ctx.fillStyle = palette.bg
  ctx.beginPath()
  ctx.roundRect(0, 0, S, S, 8)
  ctx.fill()

  const fc = palette.fgStrong
  const pa = 0.78
  const sa = 0.42

  switch (shape) {
    case 'spiral': {
      const tilt = -Math.PI / 6
      const rings = [
        { rx: 5, ry: 2.2, n: 12 },
        { rx: 9.5, ry: 4.2, n: 20 },
        { rx: 14.5, ry: 6.5, n: 30 },
        { rx: 19.5, ry: 8.8, n: 40 },
      ]
      rings.forEach(({ rx, ry, n }) => {
        for (let i = 0; i < n; i++) {
          const angle = (i / n) * Math.PI * 2
          const ex = rx * Math.cos(angle)
          const ey = ry * Math.sin(angle)
          const px = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt)
          const py = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)
          d(ctx, px, py, 0.8, pa, fc)
        }
      })
      break
    }

    case 'orbit': {
      d(ctx, cx, cy, 3.8, pa + 0.1, fc)

      const r1 = 11
      for (let i = 0; i < 22; i++) {
        const angle = (i / 22) * Math.PI * 2
        d(ctx, cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1, 0.7, sa, palette.fgSoft)
      }
      ;[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].forEach((angle) => {
        d(ctx, cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1, 2.3, pa, fc)
      })

      const r2 = 18
      for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * Math.PI * 2
        d(ctx, cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2, 0.7, sa, palette.fgSoft)
      }
      ;[Math.PI / 5, Math.PI + Math.PI / 5].forEach((angle) => {
        d(ctx, cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2, 2.3, pa, fc)
      })
      break
    }

    case 'globe': {
      const R = 17

      for (let i = 0; i < 44; i++) {
        const angle = (i / 44) * Math.PI * 2
        d(ctx, cx + Math.cos(angle) * R, cy + Math.sin(angle) * R * 0.97, 0.8, pa, fc)
      }

      ;[-R * 0.52, 0, R * 0.52].forEach((yOff) => {
        const latR = Math.sqrt(Math.max(0, R * R - yOff * yOff))
        const n = Math.max(8, Math.round(latR * 2.4))
        for (let i = 0; i < n; i++) {
          const angle = (i / n) * Math.PI * 2
          d(
            ctx,
            cx + Math.cos(angle) * latR,
            cy + yOff + Math.sin(angle) * latR * 0.28,
            0.75,
            sa + 0.06,
            palette.fgSoft,
          )
        }
      })

      ;[-Math.PI / 3.5, 0, Math.PI / 3.5].forEach((lonAngle) => {
        for (let i = 0; i < 28; i++) {
          const t = (i / 28) * Math.PI * 2
          const x3 = Math.cos(t) * Math.cos(lonAngle)
          const z3 = Math.cos(t) * Math.sin(lonAngle)
          if (lonAngle !== 0 && z3 < -0.15) continue
          d(ctx, cx + x3 * R, cy + Math.sin(t) * R * 0.97, 0.75, sa + 0.06, palette.fgSoft)
        }
      })
      break
    }

    case 'cube': {
      const hs = 11
      const rotY = 0.55
      const rotX = 0.38

      const project = ([vx, vy, vz]: number[]) => {
        const x1 = vx * Math.cos(rotY) - vz * Math.sin(rotY)
        const z1 = vx * Math.sin(rotY) + vz * Math.cos(rotY)
        const y2 = vy * Math.cos(rotX) - z1 * Math.sin(rotX)
        const z2 = vy * Math.sin(rotX) + z1 * Math.cos(rotX)
        return { x: cx + x1 * hs, y: cy + y2 * hs, z: z2 }
      }

      const verts = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
      ].map(project)

      const edges: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ]

      edges.forEach(([ai, bi]) => {
        const va = verts[ai]
        const vb = verts[bi]
        const front = va.z + vb.z > 0
        const edgeAlpha = front ? sa + 0.14 : Math.max(0.08, sa - 0.1)
        const dx = vb.x - va.x
        const dy = vb.y - va.y
        const n = Math.max(2, Math.round(Math.sqrt(dx * dx + dy * dy) / 2.6))
        for (let i = 1; i < n; i++) {
          const t = i / n
          d(ctx, va.x + dx * t, va.y + dy * t, 0.65, edgeAlpha, palette.fgSoft)
        }
      })

      verts.forEach((p) => {
        d(ctx, p.x, p.y, p.z > 0 ? 2.1 : 1.5, p.z > 0 ? pa : sa, fc)
      })
      break
    }
  }

  ctx.globalAlpha = 1
}
