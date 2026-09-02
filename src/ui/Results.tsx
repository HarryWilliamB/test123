import type { SimResult } from '../engine/sim'
import type { CharacterStats } from '../engine/stats'
import type { StatWeight } from '../engine/statWeights'
import type { GearSlot, ItemDb } from '../engine/types'
import { SLOT_LABELS } from '../engine/types'
import { QUALITY_CLASS, fmt, itemSummary, signed } from './format'
import { ItemIcon } from './ItemIcon'

interface Props {
  db: ItemDb
  stats: CharacterStats
  result: SimResult | null
  running: boolean
  weights: { baseDps: number; weights: StatWeight[] } | null
  weightsRunning: boolean
  onWeights: () => void
  compare: { slot: GearSlot; baseDps: number; results: { itemId: number; dps: number }[]; done: boolean } | null
  onEquip: (slot: GearSlot, itemId: number) => void
}

export function Results({ db, stats, result, running, weights, weightsRunning, onWeights, compare, onEquip }: Props) {
  const byId = new Map(db.items.map((i) => [i.id, i]))
  return (
    <div className="results">
      <div className="dps-box">
        <div className="dps">{result ? fmt(result.dps) : '—'}</div>
        <div className="muted tiny">DPS {result && `± ${fmt(result.stdev)} per fight`} {running && '(simulating…)'}</div>
      </div>

      <table className="kv">
        <tbody>
          <tr><td>Attack power</td><td>{stats.ap}</td><td>Str / Agi</td><td>{stats.str} / {stats.agi}</td></tr>
          <tr><td>Melee crit</td><td>{fmt(stats.critPct)}% (eff. {result ? fmt(result.table.critPct) : '—'}%)</td><td>Hit</td><td>{fmt(stats.hitPct)}%</td></tr>
          <tr><td>Haste</td><td>{fmt(stats.hastePct)}%</td><td>Weapon</td><td>{stats.weapon.min}-{stats.weapon.max} @ {stats.weapon.speed.toFixed(2)} (skill {stats.weapon.skill})</td></tr>
          <tr><td>Nature SP</td><td>{stats.natureSpellPower}</td><td>Spell crit / hit</td><td>{fmt(stats.spellCritPct)}% / {result ? fmt(result.table.spellHitPct) : '—'}%</td></tr>
          <tr><td>Mana</td><td>{stats.mana} (+{stats.mp5} mp5)</td><td>Int</td><td>{stats.int}</td></tr>
          {result && (
            <tr>
              <td>Attack table</td>
              <td colSpan={3} className="tiny">
                miss {fmt(result.table.missPct)}% · dodge {fmt(result.table.dodgePct)}% · parry {fmt(result.table.parryPct)}% · glance {fmt(result.table.glancePct)}% (×{fmt(result.table.glanceMult, 2)}) · armor −{fmt(result.table.armorReduction * 100)}%
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {result && (
        <>
          <h3>Damage breakdown</h3>
          <table className="kv">
            <tbody>
              {Object.entries(result.breakdown).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{fmt(v)}</td>
                  <td className="muted">{fmt((v / result.dps) * 100)}%</td>
                  <td><div className="bar" style={{ width: `${(v / result.dps) * 100}%` }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tiny muted">
            per fight: swings {fmt(result.counts.swings / iterations(result), 1)}, WF procs {fmt(result.counts.windfuryProcs / iterations(result), 1)}, Stormstrikes {fmt(result.counts.stormstrikes / iterations(result), 1)},
            Lightning Strikes {fmt(result.counts.lightningStrikes / iterations(result), 1)}, Earth Shocks {fmt(result.counts.earthShocks / iterations(result), 1)},
            shield orbs {fmt(result.counts.shieldOrbs / iterations(result), 1)}, time below mana reserve {fmt(result.counts.oomTime / iterations(result), 0)}s
          </div>
        </>
      )}

      <h3>
        Stat weights{' '}
        <button className="link" onClick={onWeights} disabled={weightsRunning}>{weightsRunning ? 'computing…' : weights ? 'recompute' : 'compute'}</button>
      </h3>
      <div className="tiny muted">DPS gained per +1 of each stat with the current gear, talents and settings. "AP equiv." = how many Attack Power one point is worth.</div>
      {!weights && !weightsRunning && <div className="tiny muted">Click compute (runs 13 extra simulations, a few seconds).</div>}
      {weights && (() => {
        const rows = [...weights.weights].sort((a, b) => b.perPoint - a.perPoint)
        const max = Math.max(...rows.map((w) => Math.abs(w.perPoint)), 1e-9)
        return (
          <table className="kv weights">
            <thead><tr><th>Stat</th><th>DPS / point</th><th>AP equiv.</th><th></th></tr></thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.stat}>
                  <td>{w.label}</td>
                  <td className="num">{signed(w.perPoint, 3)}</td>
                  <td className="num">{fmt(w.relative, 2)}</td>
                  <td className="bar-cell"><div className={'bar' + (w.perPoint < 0 ? ' neg' : '')} style={{ width: `${(Math.abs(w.perPoint) / max) * 100}%` }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      })()}

      {compare && (
        <>
          <h3>{SLOT_LABELS[compare.slot]} upgrades {compare.done ? '' : `(${compare.results.length} simulated…)`}</h3>
          <table className="kv compare">
            <tbody>
              {[...compare.results].sort((a, b) => b.dps - a.dps).map((r) => {
                const it = byId.get(r.itemId)
                if (!it) return null
                const d = r.dps - compare.baseDps
                return (
                  <tr key={r.itemId} className={d > 0.05 ? 'up' : d < -0.05 ? 'down' : ''}>
                    <td className="cmp-item">
                      <ItemIcon icon={it.icon} size={24} />
                      <a href={`https://octowow.st/db/?item=${it.id}`} target="_blank" rel="noreferrer" className={QUALITY_CLASS[it.quality]}>{it.name}</a>
                      <span className="muted tiny"> {it.ilvl}</span>
                      <div className="tiny muted">{itemSummary(it)}{it.source ? ` — ${it.source}` : ''}</div>
                    </td>
                    <td className="num">{signed(d)}</td>
                    <td><button className="link" onClick={() => onEquip(compare.slot, it.id)}>equip</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

function iterations(r: SimResult) {
  return r.iterations
}
