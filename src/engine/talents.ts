import talentData from '../data/talents.json'
import type { Talent } from './types'

export const TALENTS = talentData as Talent[]

/** Ranks per tree, 28 slots each (7 rows x 4 cols), as used by octowow.st/talents. */
export type TalentPoints = [number[], number[], number[]]

export const DEFAULT_BUILD_URL = 'https://octowow.st/talents/shaman/?points=FYAYL-FAVYALFQDIAoB-'

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

/** Port of the calculator's unpack routine: each rank is a 3-bit value packed MSB-first into base64. */
export function decodePoints(points: string): TalentPoints {
  const unpack = (s: string) => {
    const bits = [...b64(s)].map((b) => b.toString(2).padStart(8, '0')).join('')
    const out: number[] = []
    for (let i = 0; i + 3 <= bits.length; i += 3) out.push(parseInt(bits.slice(i, i + 3), 2))
    while (out.length < 28) out.push(0)
    return out.slice(0, 28)
  }
  if (points.endsWith('=')) {
    const all = unpack(points)
    return [all.slice(0, 28), all.slice(28, 56), all.slice(56, 84)]
  }
  const parts = points.split('-')
  if (parts.length !== 3) throw new Error('Invalid talent string')
  return parts.map((p) => unpack(p.padEnd(14, 'A'))) as TalentPoints
}

export function encodePoints(points: TalentPoints): string {
  return points
    .map((tree) => {
      const bits = tree.map((r) => r.toString(2).padStart(3, '0')).join('')
      const bytes = bits.match(/.{1,8}/g) ?? []
      const str = String.fromCharCode(...bytes.map((b) => parseInt(b.padEnd(8, '0'), 2)))
      return btoa(str).slice(0, -1).replace(/A+$/, '')
    })
    .join('-')
}

export function pointsFromUrl(url: string): TalentPoints {
  const m = url.match(/points=([A-Za-z0-9+/=_-]+)/)
  return decodePoints(m ? m[1] : url.trim())
}

export function emptyPoints(): TalentPoints {
  return [Array(28).fill(0), Array(28).fill(0), Array(28).fill(0)]
}

export function talentRank(points: TalentPoints, name: string): number {
  const t = TALENTS.find((x) => x.name === name)
  if (!t) return 0
  return points[t.tree][t.slot] ?? 0
}

export function treeTotals(points: TalentPoints): number[] {
  return points.map((t) => t.reduce((a, b) => a + b, 0))
}

export function talentAt(tree: number, slot: number): Talent | undefined {
  return TALENTS.find((t) => t.tree === tree && t.slot === slot)
}
