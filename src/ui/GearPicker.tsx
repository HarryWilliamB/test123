import { useMemo, useState } from 'react'
import { itemsForSlot } from '../engine/items'
import { GEAR_SLOTS, SLOT_LABELS, type Gear, type GearSlot, type Item, type ItemDb } from '../engine/types'
import { QUALITY_CLASS, itemSummary } from './format'

interface Props {
  db: ItemDb
  gear: Gear
  onChange: (gear: Gear) => void
  compareSlot: GearSlot | null
  onCompare: (slot: GearSlot | null) => void
}

function SlotRow({ db, slot, gear, onChange, comparing, onCompare }: {
  db: ItemDb; slot: GearSlot; gear: Gear; onChange: (g: Gear) => void; comparing: boolean; onCompare: () => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const current = gear[slot] !== undefined ? db.items.find((i) => i.id === gear[slot]) : undefined
  const candidates = useMemo(() => itemsForSlot(db, slot, gear), [db, slot, gear])
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = q ? candidates.filter((i) => i.name.toLowerCase().includes(q) || (i.source ?? '').toLowerCase().includes(q)) : candidates
    return list.slice(0, 60)
  }, [candidates, query])

  const pick = (it: Item | undefined) => {
    const next = { ...gear }
    if (it) next[slot] = it.id
    else delete next[slot]
    if (slot === 'mainHand' && it?.slot === 'Two-Hand') delete next.offHand
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={'slot' + (comparing ? ' comparing' : '')}>
      <div className="slot-head">
        <span className="slot-label">{SLOT_LABELS[slot]}</span>
        <button className="link" onClick={onCompare} disabled={candidates.length === 0} title="Simulate every item for this slot">
          {comparing ? 'comparing…' : 'compare'}
        </button>
        {current && <button className="link" onClick={() => pick(undefined)}>clear</button>}
      </div>
      <div className="slot-body">
        <input
          className="slot-search"
          placeholder={current ? current.name : candidates.length ? 'search item…' : '—'}
          value={query}
          disabled={candidates.length === 0}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && filtered.length > 0 && (
          <ul className="dropdown">
            {filtered.map((it) => (
              <li key={it.id} onMouseDown={() => pick(it)}>
                <span className={QUALITY_CLASS[it.quality]}>{it.name}</span>
                <span className="muted"> ilvl {it.ilvl}{it.verified ? '' : ' *'}</span>
                <div className="tiny muted">{itemSummary(it)}{it.source ? ` — ${it.source}` : ''}</div>
              </li>
            ))}
          </ul>
        )}
        {current && (
          <div className="tiny">
            <span className={QUALITY_CLASS[current.quality]}>{current.name}</span>
            <span className="muted"> ilvl {current.ilvl}{current.verified ? '' : ' *'}</span>
            <div className="muted">{itemSummary(current)}</div>
            {current.source && <div className="muted">{current.source}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export function GearPicker({ db, gear, onChange, compareSlot, onCompare }: Props) {
  return (
    <div className="gear">
      {GEAR_SLOTS.map((slot) => (
        <SlotRow
          key={slot}
          db={db}
          slot={slot}
          gear={gear}
          onChange={onChange}
          comparing={compareSlot === slot}
          onCompare={() => onCompare(compareSlot === slot ? null : slot)}
        />
      ))}
      <div className="tiny muted">* stats from Turtle-WoW 1.18 database, not yet verified against octowow.st</div>
    </div>
  )
}
