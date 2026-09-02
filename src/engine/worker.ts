import itemDb from '../data/items.json'
import type { SimConfig } from './config'
import { simulate, type SimResult } from './sim'
import { computeStats } from './stats'
import { statWeights, type StatWeight } from './statWeights'
import type { TalentPoints } from './talents'
import type { Gear, GearSlot, ItemDb } from './types'

const db = itemDb as unknown as ItemDb

export type WorkerRequest =
  | { id: number; type: 'simulate'; gear: Gear; points: TalentPoints; cfg: SimConfig }
  | { id: number; type: 'weights'; gear: Gear; points: TalentPoints; cfg: SimConfig; iterations: number }
  | { id: number; type: 'compare'; gear: Gear; points: TalentPoints; cfg: SimConfig; slot: GearSlot; itemIds: number[]; iterations: number }

export type WorkerResponse =
  | { id: number; type: 'simulate'; result: SimResult }
  | { id: number; type: 'weights'; baseDps: number; weights: StatWeight[] }
  | { id: number; type: 'compare'; baseDps: number; results: { itemId: number; dps: number }[]; done: boolean }

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (msg.type === 'simulate') {
    const result = simulate(computeStats(db, msg.gear, msg.points, msg.cfg), msg.points, msg.cfg, 1)
    const res: WorkerResponse = { id: msg.id, type: 'simulate', result }
    self.postMessage(res)
  } else if (msg.type === 'weights') {
    const r = statWeights(db, msg.gear, msg.points, msg.cfg, msg.iterations)
    const res: WorkerResponse = { id: msg.id, type: 'weights', baseDps: r.baseDps, weights: r.weights }
    self.postMessage(res)
  } else if (msg.type === 'compare') {
    const baseDps = simulate(computeStats(db, msg.gear, msg.points, msg.cfg), msg.points, msg.cfg, 3, msg.iterations).dps
    const results: { itemId: number; dps: number }[] = []
    const flush = (done: boolean) => {
      const res: WorkerResponse = { id: msg.id, type: 'compare', baseDps, results: [...results], done }
      self.postMessage(res)
    }
    for (let i = 0; i < msg.itemIds.length; i++) {
      const gear = { ...msg.gear, [msg.slot]: msg.itemIds[i] }
      results.push({ itemId: msg.itemIds[i], dps: simulate(computeStats(db, gear, msg.points, msg.cfg), msg.points, msg.cfg, 3, msg.iterations).dps })
      if (i % 10 === 9) flush(false)
    }
    flush(true)
  }
}
