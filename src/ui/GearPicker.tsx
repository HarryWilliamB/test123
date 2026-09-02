import { useEffect, useMemo, useRef, useState } from 'react'
import { itemsForSlot } from '../engine/items'
import { SLOT_LABELS, type Gear, type GearSlot, type Item, type ItemDb } from '../engine/types'
import { QUALITY_CLASS, itemSummary } from './format'
import { ItemIcon } from './ItemIcon'

interface Props {
  db: ItemDb
  gear: Gear
  onChange: (gear: Gear) => void
  compareSlot: GearSlot | null
  onCompare: (slot: GearSlot | null) => void
}

const LEFT: GearSlot[] = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist']
const RIGHT: GearSlot[] = ['hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2']
const BOTTOM: GearSlot[] = ['mainHand', 'offHand', 'relic']

const SLOT_ICON: Record<GearSlot, string> = {
  head: 'M12 3a7 7 0 0 0-7 7v4l2 2h10l2-2v-4a7 7 0 0 0-7-7z',
  neck: 'M6 4c0 6 3 8 6 11 3-3 6-5 6-11M12 15v3M10 18h4v3h-4z',
  shoulder: 'M4 10c2-4 5-6 8-6s6 2 8 6l-3 2-5-3-5 3z',
  back: 'M8 3h8l3 17H5zM12 3v17',
  chest: 'M7 4l5 2 5-2 3 5-2 2v9H6v-9L4 9z',
  wrist: 'M8 5h8v14H8zM8 9h8M8 15h8',
  hands: 'M9 21V11M9 11V5M12 11V4M15 11V6M18 11v-3M6 13l3-2h9v6a4 4 0 0 1-4 4H9z',
  waist: 'M3 10h18v4H3zM10 9h4v6h-4z',
  legs: 'M7 3h10l1 18h-4l-2-9-2 9H6z',
  feet: 'M7 4h6v9l7 4v3H4v-4l3-3z',
  finger1: 'M12 21a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM12 3l2 3h-4z',
  finger2: 'M12 21a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM12 3l2 3h-4z',
  trinket1: 'M12 2l3 6 6 1-4.5 4 1.5 7-6-3-6 3 1.5-7L3 9l6-1z',
  trinket2: 'M12 2l3 6 6 1-4.5 4 1.5 7-6-3-6 3 1.5-7L3 9l6-1z',
  mainHand: 'M4 20l10-10M14 10l5-7-7 5M6 18l-2 2M8 16l2 2',
  offHand: 'M12 2l8 3v6c0 5-3 9-8 11-5-2-8-6-8-11V5z',
  relic: 'M12 2l5 5-5 15-5-15zM7 7h10',
}

function Slot({ slot, item, active, comparing, onClick }: {
  slot: GearSlot; item: Item | undefined; active: boolean; comparing: boolean; onClick: () => void
}) {
  const q = item ? QUALITY_CLASS[item.quality] : ''
  return (
    <button
      className={'pd-slot ' + q + (active ? ' active' : '') + (comparing ? ' comparing' : '') + (item ? '' : ' empty')}
      onClick={onClick}
      title={item ? `${item.name}\n${itemSummary(item)}` : SLOT_LABELS[slot]}
    >
      {item?.icon ? (
        <ItemIcon icon={item.icon} size={52} />
      ) : (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
          <path d={SLOT_ICON[slot]} />
        </svg>
      )}
      <span className="pd-name">{item ? item.name : SLOT_LABELS[slot]}</span>
    </button>
  )
}

function Picker({ db, slot, gear, onChange, comparing, onCompare, onClose }: {
  db: ItemDb; slot: GearSlot; gear: Gear; onChange: (g: Gear) => void; comparing: boolean; onCompare: () => void; onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const current = gear[slot] !== undefined ? db.items.find((i) => i.id === gear[slot]) : undefined
  const candidates = useMemo(() => itemsForSlot(db, slot, gear), [db, slot, gear])
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = q ? candidates.filter((i) => i.name.toLowerCase().includes(q) || (i.source ?? '').toLowerCase().includes(q)) : candidates
    return list.slice(0, 80)
  }, [candidates, query])

  useEffect(() => { inputRef.current?.focus() }, [slot])

  const pick = (it: Item | undefined) => {
    const next = { ...gear }
    if (it) next[slot] = it.id
    else delete next[slot]
    if (slot === 'mainHand' && it?.slot === 'Two-Hand') delete next.offHand
    onChange(next)
    setQuery('')
  }

  return (
    <div className="picker">
      <div className="picker-head">
        <strong>{SLOT_LABELS[slot]}</strong>
        <button className="link" onClick={onCompare} disabled={candidates.length === 0} title="Simulate every item for this slot">
          {comparing ? 'comparing…' : 'compare all'}
        </button>
        {current && <button className="link" onClick={() => pick(undefined)}>unequip</button>}
        <button className="link" onClick={onClose}>close</button>
      </div>
      {current && (
        <div className="picker-current tiny">
          <ItemIcon icon={current.icon} size={36} />
          <div>
            <span className={QUALITY_CLASS[current.quality]}>{current.name}</span>
            <span className="muted"> ilvl {current.ilvl}</span>
            <div className="muted">{itemSummary(current)}</div>
            {current.source && <div className="muted">{current.source}</div>}
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        className="slot-search"
        placeholder={candidates.length ? `search ${candidates.length} items…` : 'nothing can be equipped here'}
        value={query}
        disabled={candidates.length === 0}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      />
      <ul className="picker-list">
        {filtered.map((it) => (
          <li key={it.id} className={it.id === current?.id ? 'selected' : ''} onClick={() => pick(it)}>
            <ItemIcon icon={it.icon} size={28} />
            <div>
              <span className={QUALITY_CLASS[it.quality]}>{it.name}</span>
              <span className="muted"> ilvl {it.ilvl}</span>
              <div className="tiny muted">{itemSummary(it)}{it.source ? ` — ${it.source}` : ''}</div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && candidates.length > 0 && <li className="muted">no matches</li>}
      </ul>
    </div>
  )
}

export function GearPicker({ db, gear, onChange, compareSlot, onCompare }: Props) {
  const [openSlot, setOpenSlot] = useState<GearSlot | null>(null)
  const find = (slot: GearSlot) => (gear[slot] !== undefined ? db.items.find((i) => i.id === gear[slot]) : undefined)
  const renderSlot = (slot: GearSlot) => (
    <Slot
      key={slot}
      slot={slot}
      item={find(slot)}
      active={openSlot === slot}
      comparing={compareSlot === slot}
      onClick={() => setOpenSlot(openSlot === slot ? null : slot)}
    />
  )
  return (
    <div className="gear">
      <div className="paperdoll">
        <div className="pd-col">{LEFT.map(renderSlot)}</div>
        <div className="pd-center">
          {openSlot ? (
            <Picker
              db={db}
              slot={openSlot}
              gear={gear}
              onChange={onChange}
              comparing={compareSlot === openSlot}
              onCompare={() => onCompare(compareSlot === openSlot ? null : openSlot)}
              onClose={() => setOpenSlot(null)}
            />
          ) : (
            <div className="pd-hint muted tiny">Click a slot to change its item.</div>
          )}
        </div>
        <div className="pd-col">{RIGHT.map(renderSlot)}</div>
        <div className="pd-bottom">{BOTTOM.map(renderSlot)}</div>
      </div>
    </div>
  )
}
