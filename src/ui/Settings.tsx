import { useState } from 'react'
import { MECHANIC_FIELDS, type BuffFlags, type Enchants, type SimConfig } from '../engine/config'
import { ItemIcon } from './ItemIcon'
import { TALENTS, encodePoints, pointsFromUrl, talentAt, treeTotals, type TalentPoints } from '../engine/talents'

interface Props {
  cfg: SimConfig
  onChange: (cfg: SimConfig) => void
  points: TalentPoints
  onPoints: (p: TalentPoints) => void
}

const BUFF_LABELS: Record<keyof BuffFlags, string> = {
  strengthOfEarth: 'Strength of Earth Totem', graceOfAir: 'Grace of Air Totem', manaSpring: 'Mana Spring Totem',
  battleShout: 'Battle Shout', markOfTheWild: 'Mark of the Wild', mongoose: 'Elixir of the Mongoose', jujuPower: 'Juju Power',
  jujuMight: 'Juju Might', firewater: 'Winterfall Firewater', strengthFood: '+20 Str food', rallyingCry: 'Rallying Cry of the Dragonslayer',
  songflower: 'Songflower Serenade', warchiefsBlessing: "Warchief's Blessing", spiritOfZandalar: 'Spirit of Zandalar',
  darkmoonDamage: 'Sayge\'s Dark Fortune of Damage', sunderArmor: 'Sunder Armor x5', faerieFire: 'Faerie Fire', curseOfRecklessness: 'Curse of Recklessness',
}

const ENCHANT_OPTIONS: { [K in keyof Enchants]: [Enchants[K], string][] } = {
  weapon: [['none', 'None'], ['crusader', 'Crusader'], ['agi15', '+15 Agility'], ['agi25', '+25 Agility (2H)'], ['str15', '+15 Strength (2H)'], ['dmg5', '+5 Damage'], ['dmg9', '+9 Damage (2H)']],
  head: [['none', 'None'], ['rapidity', 'Arcanum of Rapidity (1% haste)'], ['voracityStr', 'Arcanum of Voracity (+8 Str)'], ['voracityAgi', 'Arcanum of Voracity (+8 Agi)'], ['falconsCall', "Falcon's Call (+1% hit)"]],
  legs: [['none', 'None'], ['rapidity', 'Arcanum of Rapidity (1% haste)'], ['voracityStr', 'Arcanum of Voracity (+8 Str)'], ['voracityAgi', 'Arcanum of Voracity (+8 Agi)'], ['falconsCall', "Falcon's Call (+1% hit)"]],
  shoulder: [['none', 'None'], ['zandalarMight', 'Zandalar Signet of Might (+30 AP)'], ['scourgeMight', 'Might of the Scourge (+26 AP, 1% crit)']],
  back: [['none', 'None'], ['agi3', '+3 Agility'], ['dodge1', '+1% Dodge']],
  chest: [['none', 'None'], ['stats4', '+4 All Stats'], ['stats3', '+3 All Stats']],
  wrist: [['none', 'None'], ['str9', '+9 Strength'], ['sta9', '+9 Stamina'], ['int5', '+5 Intellect']],
  hands: [['none', 'None'], ['agi15', '+15 Agility'], ['str7', '+7 Strength'], ['haste1', '+1% Haste']],
  feet: [['none', 'None'], ['agi7', '+7 Agility'], ['speed', 'Minor Speed']],
}

function Section({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  )
}

function Num({ cfg, k, onChange, step, min, max }: { cfg: SimConfig; k: keyof SimConfig; onChange: (c: SimConfig) => void; step?: number; min?: number; max?: number }) {
  return (
    <input
      type="number"
      value={cfg[k] as number}
      step={step ?? 1}
      min={min}
      max={max}
      onChange={(e) => onChange({ ...cfg, [k]: Number(e.target.value) })}
    />
  )
}

function Check({ cfg, k, onChange, label }: { cfg: SimConfig; k: keyof SimConfig; onChange: (c: SimConfig) => void; label: string }) {
  return (
    <label className="check">
      <input type="checkbox" checked={cfg[k] as boolean} onChange={(e) => onChange({ ...cfg, [k]: e.target.checked })} /> {label}
    </label>
  )
}

function TalentTree({ tree, points, onPoints }: { tree: number; points: TalentPoints; onPoints: (p: TalentPoints) => void }) {
  const cells = []
  for (let slot = 0; slot < 28; slot++) {
    const t = talentAt(tree, slot)
    const rank = points[tree][slot]
    cells.push(
      <div
        key={slot}
        className={'talent' + (t ? (rank > 0 ? ' active' : '') : ' empty')}
        title={t ? `${t.name} (${rank}/${t.ranks})\n${t.description}` : ''}
        onClick={(e) => {
          if (!t) return
          const next = points.map((x) => [...x]) as TalentPoints
          next[tree][slot] = e.shiftKey ? Math.max(0, rank - 1) : Math.min(t.ranks, rank + 1)
          onPoints(next)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          if (!t) return
          const next = points.map((x) => [...x]) as TalentPoints
          next[tree][slot] = Math.max(0, rank - 1)
          onPoints(next)
        }}
      >
        {t && <ItemIcon icon={t.icon} size={26} />}
        {t && <span className="rank">{rank}/{t.ranks}</span>}
      </div>,
    )
  }
  return <div className="tree">{cells}</div>
}

export function Settings({ cfg, onChange, points, onPoints }: Props) {
  const [talentUrl, setTalentUrl] = useState('')
  const [talentErr, setTalentErr] = useState('')
  const totals = treeTotals(points)
  const treeNames = [0, 1, 2].map((i) => TALENTS.find((t) => t.tree === i)?.treeName ?? '')
  const setBuff = (k: keyof BuffFlags, v: boolean) => onChange({ ...cfg, buffs: { ...cfg.buffs, [k]: v } })
  const setEnchant = <K extends keyof Enchants>(k: K, v: Enchants[K]) => onChange({ ...cfg, enchants: { ...cfg.enchants, [k]: v } })

  return (
    <div className="settings">
      <Section title={`Talents (${totals.join('/')})`} open>
        <div className="row">
          <input
            placeholder="paste octowow.st talent URL"
            value={talentUrl}
            onChange={(e) => setTalentUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              try { onPoints(pointsFromUrl(talentUrl)); setTalentErr(''); setTalentUrl('') } catch { setTalentErr('Could not parse that URL') }
            }}
          />
        </div>
        {talentErr && <div className="error tiny">{talentErr}</div>}
        <div className="tiny muted">
          Click to add a point, right-click / shift-click to remove.{' '}
          <a href={`https://octowow.st/talents/shaman/?points=${encodePoints(points)}`} target="_blank" rel="noreferrer">Open on octowow.st</a>
        </div>
        <div className="trees">
          {[0, 1, 2].map((tree) => (
            <div key={tree}>
              <div className="tiny">{treeNames[tree]} ({totals[tree]})</div>
              <TalentTree tree={tree} points={points} onPoints={onPoints} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Character & fight" open>
        <label>Race
          <select value={cfg.race} onChange={(e) => onChange({ ...cfg, race: e.target.value as SimConfig['race'] })}>
            <option>Orc</option><option>Tauren</option><option>Troll</option>
          </select>
        </label>
        <label>Weapon imbue
          <select value={cfg.imbue} onChange={(e) => onChange({ ...cfg, imbue: e.target.value as SimConfig['imbue'] })}>
            <option value="windfury">Windfury Weapon</option>
            <option value="flametongue">Flametongue Weapon</option>
            <option value="rockbiter">Rockbiter Weapon</option>
            <option value="none">None</option>
          </select>
        </label>
        <label>Fight length (s) <Num cfg={cfg} k="fightLength" onChange={onChange} min={10} max={600} /></label>
        <label>Iterations <Num cfg={cfg} k="iterations" onChange={onChange} min={100} max={20000} step={100} /></label>
        <Check cfg={cfg} k="attackFromBehind" onChange={onChange} label="Attacking from behind (no parries)" />
        <Check cfg={cfg} k="useLightningShield" onChange={onChange} label="Keep Lightning Shield up" />
        <Check cfg={cfg} k="useStormstrike" onChange={onChange} label="Use Stormstrike" />
        <Check cfg={cfg} k="useLightningStrike" onChange={onChange} label="Use Lightning Strike" />
        <Check cfg={cfg} k="useEarthShock" onChange={onChange} label="Use Earth Shock" />
        <Check cfg={cfg} k="useBloodlust" onChange={onChange} label="Use Bloodlust" />
        <Check cfg={cfg} k="useRacial" onChange={onChange} label="Use racial (Blood Fury / Berserking)" />
      </Section>

      <Section title="Buffs & consumables">
        {(Object.keys(BUFF_LABELS) as (keyof BuffFlags)[]).map((k) => (
          <label key={k} className="check">
            <input type="checkbox" checked={cfg.buffs[k]} onChange={(e) => setBuff(k, e.target.checked)} /> {BUFF_LABELS[k]}
          </label>
        ))}
      </Section>

      <Section title="Enchants">
        {(Object.keys(ENCHANT_OPTIONS) as (keyof Enchants)[]).map((k) => (
          <label key={k}>{k}
            <select value={cfg.enchants[k]} onChange={(e) => setEnchant(k, e.target.value as Enchants[typeof k])}>
              {ENCHANT_OPTIONS[k].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        ))}
      </Section>

      <Section title="OctoWow mechanics (edit to match server)">
        <div className="tiny muted">These numbers are not published by OctoWow; defaults are vanilla values or guesses. Adjust to match in-game tooltips/logs.</div>
        {MECHANIC_FIELDS.map((g) => (
          <fieldset key={g.group}>
            <legend>{g.group}</legend>
            {g.fields.map((f) => (
              <label key={f.key} title={f.help}>{f.label}
                <Num cfg={cfg} k={f.key} onChange={onChange} step={f.step} min={f.min} max={f.max} />
                <span className="tiny muted">{f.help}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </Section>
    </div>
  )
}
