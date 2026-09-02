# OctoWow Enhancement Shaman DPS calculator

Browser-based gear/DPS calculator for Enhancement Shaman on [OctoWow](https://octowow.st).
Pick gear per slot, tweak talents and fight settings, and a Monte-Carlo combat
simulation (running in a Web Worker) reports DPS, damage breakdown, per-slot
upgrade lists and stat weights.

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint     # oxlint
```

Node 22 (see `.nvmrc`).

## Data

- `src/data/items.json` — 3.4k shaman-usable items (ilvl 50+). Baseline stats
  come from the Turtle-WoW 1.18 world DB (`item_template`/`spell_template`);
  items that were verified against octowow.st/db tooltips are flagged
  `verified: true`, unverified ones show a `*` in the UI. Drop sources come from
  AtlasLoot.
- `src/data/talents.json` — the 49 shaman talents scraped from
  octowow.st/talents, including OctoWow-specific ones (Lightning Strike,
  Elemental Weapons, Improved Windfury, ...).

## Simulation model

All OctoWow-specific numbers that could not be confirmed from tooltips
(Windfury proc chance/AP, Lightning Shield damage and coefficient, Stormstrike
and Lightning Strike cooldowns/mana costs, Earth Shock damage, boss armor, ...)
are exposed under **OctoWow mechanics** in the settings panel and can be edited
to match the server. Defaults are vanilla-like guesses.

Modelled: melee attack table (miss/dodge/parry/glancing/crit vs. level 63),
armor mitigation, Flurry, Windfury (with Elemental Weapons / Improved Windfury),
Stormstrike nature-damage charges, Lightning Strike, Lightning Shield orbs,
Earth Shock, Bloodlust, Blood Fury / Berserking, item procs, Crusader, and
mana usage (abilities stop when below the mana reserve).

Talent builds are shared using the same `?points=` encoding as octowow.st, so
you can paste a talent URL in or open the current build there.
