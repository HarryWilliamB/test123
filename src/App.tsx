import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import itemDb from './data/items.json'
import { request, resetWorker } from './engine/client'
import { DEFAULT_CONFIG, type SimConfig } from './engine/config'
import type { SimResult } from './engine/sim'
import { computeStats } from './engine/stats'
import type { StatWeight } from './engine/statWeights'
import { DEFAULT_BUILD_URL, pointsFromUrl, type TalentPoints } from './engine/talents'
import type { Gear, GearSlot, ItemDb } from './engine/types'
import { itemsForSlot } from './engine/items'
import { GearPicker } from './ui/GearPicker'
import { Results } from './ui/Results'
import { Settings } from './ui/Settings'

const db = itemDb as unknown as ItemDb

const DEFAULT_GEAR: Gear = {
  head: 16947, shoulder: 16945, chest: 16950, hands: 16948, waist: 16944, legs: 16946, feet: 16949, wrist: 16943,
  neck: 18404, back: 19436, finger1: 17063, finger2: 19325, trinket1: 11815, mainHand: 17068, offHand: 17066,
}

function useStored<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      const parsed = JSON.parse(raw)
      return Array.isArray(initial) ? (parsed as T) : { ...initial, ...parsed }
    } catch {
      return initial
    }
  })
  const set = useCallback((v: T) => {
    setValue(v)
    localStorage.setItem(key, JSON.stringify(v))
  }, [key])
  return [value, set]
}

export default function App() {
  const [gear, setGear] = useStored<Gear>('enh.gear', DEFAULT_GEAR)
  const [cfg, setCfg] = useStored<SimConfig>('enh.cfg', DEFAULT_CONFIG)
  const [points, setPoints] = useStored<TalentPoints>('enh.points', pointsFromUrl(DEFAULT_BUILD_URL))
  const [result, setResult] = useState<{ key: string; result: SimResult } | null>(null)
  const [weights, setWeights] = useState<{ key: string; running: boolean; data: { baseDps: number; weights: StatWeight[] } | null } | null>(null)
  const [compareSlot, setCompareSlot] = useState<GearSlot | null>(null)
  const [compare, setCompare] = useState<{ key: string; slot: GearSlot; baseDps: number; results: { itemId: number; dps: number }[]; done: boolean } | null>(null)
  const cancelCompare = useRef<(() => void) | null>(null)

  const mergedCfg = useMemo(() => ({ ...DEFAULT_CONFIG, ...cfg, buffs: { ...DEFAULT_CONFIG.buffs, ...cfg.buffs }, enchants: { ...DEFAULT_CONFIG.enchants, ...cfg.enchants } }), [cfg])
  const stats = useMemo(() => computeStats(db, gear, points, mergedCfg), [gear, points, mergedCfg])
  /** Identifies the current inputs so stale async results can be ignored. */
  const key = useMemo(() => JSON.stringify([gear, points, mergedCfg]), [gear, points, mergedCfg])

  useEffect(() => {
    let cancel: (() => void) | null = null
    const timer = setTimeout(() => {
      cancel = request({ type: 'simulate', gear, points, cfg: mergedCfg }, (res) => {
        if (res.type === 'simulate') setResult({ key, result: res.result })
      })
    }, 150)
    return () => { clearTimeout(timer); cancel?.() }
  }, [key, gear, points, mergedCfg])

  useEffect(() => {
    cancelCompare.current?.()
    if (!compareSlot) return
    const ids = itemsForSlot(db, compareSlot, gear).map((i) => i.id)
    const iterations = Math.max(100, Math.min(400, Math.round(60000 / Math.max(1, ids.length))))
    const slot = compareSlot
    cancelCompare.current = request({ type: 'compare', gear, points, cfg: mergedCfg, slot, itemIds: ids, iterations }, (res) => {
      if (res.type === 'compare') setCompare({ key, slot, baseDps: res.baseDps, results: res.results, done: res.done })
    })
  }, [key, compareSlot, gear, points, mergedCfg])

  const runWeights = () => {
    setWeights({ key, running: true, data: null })
    request({ type: 'weights', gear, points, cfg: mergedCfg, iterations: Math.min(mergedCfg.iterations, 1500) }, (res) => {
      if (res.type === 'weights') setWeights({ key, running: false, data: { baseDps: res.baseDps, weights: res.weights } })
    })
  }

  const currentResult = result?.key === key ? result.result : null
  const currentWeights = weights?.key === key ? weights : null
  const currentCompare = compareSlot && compare?.key === key && compare.slot === compareSlot ? compare : compareSlot ? { slot: compareSlot, baseDps: 0, results: [], done: false } : null

  const reset = () => {
    resetWorker()
    setGear(DEFAULT_GEAR)
    setCfg(DEFAULT_CONFIG)
    setPoints(pointsFromUrl(DEFAULT_BUILD_URL))
    setCompareSlot(null)
  }

  return (
    <div className="app">
      <header>
        <h1>OctoWow Enhancement Shaman DPS</h1>
        <span className="muted tiny">{db.items.length} items · data from octowow.st/db, Turtle-WoW 1.18 DB and AtlasLoot</span>
        <button className="link" onClick={reset}>reset all</button>
      </header>
      <main>
        <aside className="col left"><Settings cfg={mergedCfg} onChange={setCfg} points={points} onPoints={setPoints} /></aside>
        <section className="col mid"><GearPicker db={db} gear={gear} onChange={setGear} compareSlot={compareSlot} onCompare={setCompareSlot} sets={stats.sets} /></section>
        <section className="col right">
          <Results
            db={db}
            stats={stats}
            result={currentResult ?? result?.result ?? null}
            running={!currentResult}
            weights={currentWeights?.data ?? null}
            weightsRunning={currentWeights?.running ?? false}
            onWeights={runWeights}
            compare={currentCompare}
            onEquip={(slot, id) => setGear({ ...gear, [slot]: id })}
          />
        </section>
      </main>
    </div>
  )
}
