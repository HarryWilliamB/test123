export type Race = 'Orc' | 'Tauren' | 'Troll'

export type Imbue = 'windfury' | 'flametongue' | 'rockbiter' | 'none'

export interface BuffFlags {
  strengthOfEarth: boolean
  graceOfAir: boolean
  manaSpring: boolean
  battleShout: boolean
  markOfTheWild: boolean
  mongoose: boolean
  jujuPower: boolean
  jujuMight: boolean
  firewater: boolean
  strengthFood: boolean
  rallyingCry: boolean
  songflower: boolean
  warchiefsBlessing: boolean
  spiritOfZandalar: boolean
  darkmoonDamage: boolean
  sunderArmor: boolean
  faerieFire: boolean
  curseOfRecklessness: boolean
}

export interface Enchants {
  weapon: 'none' | 'crusader' | 'agi15' | 'agi25' | 'str15' | 'dmg5' | 'dmg9'
  head: 'none' | 'rapidity' | 'voracityStr' | 'voracityAgi' | 'falconsCall'
  legs: 'none' | 'rapidity' | 'voracityStr' | 'voracityAgi' | 'falconsCall'
  shoulder: 'none' | 'zandalarMight' | 'scourgeMight'
  back: 'none' | 'agi3' | 'dodge1'
  chest: 'none' | 'stats4' | 'stats3'
  wrist: 'none' | 'str9' | 'sta9' | 'int5'
  hands: 'none' | 'agi15' | 'str7' | 'haste1'
  feet: 'none' | 'agi7' | 'speed'
}

/**
 * Every OctoWow-specific number that is not directly readable from the talent
 * calculator or item database is an explicit, editable input here.
 */
export interface SimConfig {
  race: Race
  fightLength: number
  iterations: number
  attackFromBehind: boolean
  targetLevel: number
  targetArmor: number
  baseCritPct: number
  baseSpellCritPct: number

  imbue: Imbue
  windfuryProcChance: number
  windfuryBonusAp: number
  windfuryExtraAttacks: number
  flametongueDamage: number
  rockbiterAp: number

  useLightningShield: boolean
  lightningShieldDamage: number
  lightningShieldCoef: number
  lightningShieldCharges: number
  lightningShieldManaCost: number
  empoweredShieldMultiplier: number

  useStormstrike: boolean
  stormstrikeCooldown: number
  stormstrikeManaCost: number
  stormstrikeNatureBonusPct: number
  stormstrikeCharges: number

  useLightningStrike: boolean
  lightningStrikeCooldown: number
  lightningStrikeManaCost: number
  lightningStrikeWeaponPct: number
  lightningStrikeNaturePct: number

  useEarthShock: boolean
  earthShockMin: number
  earthShockMax: number
  earthShockCoef: number
  earthShockCooldown: number
  earthShockManaCost: number
  manaReserve: number

  useBloodlust: boolean
  bloodlustCooldown: number
  useRacial: boolean

  buffs: BuffFlags
  enchants: Enchants
}

export const DEFAULT_CONFIG: SimConfig = {
  race: 'Orc',
  fightLength: 120,
  iterations: 2000,
  attackFromBehind: true,
  targetLevel: 63,
  targetArmor: 3731,
  baseCritPct: 1.7,
  baseSpellCritPct: 2.2,

  imbue: 'windfury',
  windfuryProcChance: 20,
  windfuryBonusAp: 333,
  windfuryExtraAttacks: 1,
  flametongueDamage: 40,
  rockbiterAp: 100,

  useLightningShield: true,
  lightningShieldDamage: 100,
  lightningShieldCoef: 0.33,
  lightningShieldCharges: 3,
  lightningShieldManaCost: 305,
  empoweredShieldMultiplier: 2,

  useStormstrike: true,
  stormstrikeCooldown: 20,
  stormstrikeManaCost: 235,
  stormstrikeNatureBonusPct: 25,
  stormstrikeCharges: 2,

  useLightningStrike: true,
  lightningStrikeCooldown: 6,
  lightningStrikeManaCost: 120,
  lightningStrikeWeaponPct: 20,
  lightningStrikeNaturePct: 10,

  useEarthShock: true,
  earthShockMin: 517,
  earthShockMax: 543,
  earthShockCoef: 0.4286,
  earthShockCooldown: 6,
  earthShockManaCost: 450,
  manaReserve: 300,

  useBloodlust: true,
  bloodlustCooldown: 300,
  useRacial: true,

  buffs: {
    strengthOfEarth: true,
    graceOfAir: true,
    manaSpring: true,
    battleShout: false,
    markOfTheWild: false,
    mongoose: false,
    jujuPower: false,
    jujuMight: false,
    firewater: false,
    strengthFood: false,
    rallyingCry: false,
    songflower: false,
    warchiefsBlessing: false,
    spiritOfZandalar: false,
    darkmoonDamage: false,
    sunderArmor: true,
    faerieFire: false,
    curseOfRecklessness: false,
  },
  enchants: {
    weapon: 'crusader',
    head: 'none',
    legs: 'none',
    shoulder: 'none',
    back: 'none',
    chest: 'none',
    wrist: 'none',
    hands: 'none',
    feet: 'none',
  },
}

export interface ConfigField {
  key: keyof SimConfig
  label: string
  help: string
  step?: number
  min?: number
  max?: number
}

/** OctoWow-specific mechanics that should be verified in game; shown as editable fields. */
export const MECHANIC_FIELDS: { group: string; fields: ConfigField[] }[] = [
  {
    group: 'Windfury Weapon',
    fields: [
      { key: 'windfuryProcChance', label: 'Proc chance %', help: 'Vanilla: 20%', min: 0, max: 100 },
      { key: 'windfuryBonusAp', label: 'Bonus AP on proc', help: 'Vanilla rank 4: 333', min: 0 },
      { key: 'windfuryExtraAttacks', label: 'Extra attacks per proc', help: 'Vanilla: 1', min: 0, max: 3 },
    ],
  },
  {
    group: 'Lightning Shield',
    fields: [
      { key: 'lightningShieldDamage', label: 'Damage per charge', help: 'Vanilla rank 7: 100 Nature', min: 0 },
      { key: 'lightningShieldCoef', label: 'Spell power coefficient', help: 'Fraction of Nature spell power added per orb', step: 0.01, min: 0 },
      { key: 'lightningShieldCharges', label: 'Base charges', help: 'Vanilla: 3 (Stable Shields adds more)', min: 1 },
      { key: 'lightningShieldManaCost', label: 'Mana cost', help: 'Vanilla rank 7: 305', min: 0 },
      { key: 'empoweredShieldMultiplier', label: 'Empowered orb multiplier', help: 'Damage multiplier for the orb triggered by Lightning Strike (unknown, guess 2x)', step: 0.1, min: 0 },
    ],
  },
  {
    group: 'Stormstrike',
    fields: [
      { key: 'stormstrikeCooldown', label: 'Cooldown (s)', help: 'Vanilla: 20s', step: 0.5, min: 1 },
      { key: 'stormstrikeManaCost', label: 'Mana cost', help: 'Vanilla: 21% of base mana ~= 235', min: 0 },
      { key: 'stormstrikeNatureBonusPct', label: 'Nature bonus %', help: 'Talent text: 25%', min: 0 },
      { key: 'stormstrikeCharges', label: 'Nature bonus charges', help: 'Talent text: 2', min: 0 },
    ],
  },
  {
    group: 'Lightning Strike',
    fields: [
      { key: 'lightningStrikeCooldown', label: 'Cooldown (s)', help: 'Unknown, guess 6s', step: 0.5, min: 1 },
      { key: 'lightningStrikeManaCost', label: 'Mana cost', help: 'Unknown', min: 0 },
      { key: 'lightningStrikeWeaponPct', label: 'Weapon damage %', help: 'Talent text: 20%', min: 0 },
      { key: 'lightningStrikeNaturePct', label: 'Extra Nature %', help: 'Talent text: 10%', min: 0 },
    ],
  },
  {
    group: 'Earth Shock',
    fields: [
      { key: 'earthShockMin', label: 'Min damage', help: 'Vanilla rank 7: 517', min: 0 },
      { key: 'earthShockMax', label: 'Max damage', help: 'Vanilla rank 7: 543', min: 0 },
      { key: 'earthShockCoef', label: 'Spell power coefficient', help: 'Vanilla: 0.4286', step: 0.01, min: 0 },
      { key: 'earthShockCooldown', label: 'Cooldown (s)', help: 'Vanilla: 6s (Reverberation reduces)', step: 0.1, min: 0.5 },
      { key: 'earthShockManaCost', label: 'Mana cost', help: 'Vanilla rank 7: 450', min: 0 },
      { key: 'manaReserve', label: 'Mana reserve', help: 'Skip Earth Shock below this mana', min: 0 },
    ],
  },
  {
    group: 'Bloodlust / racials',
    fields: [
      { key: 'bloodlustCooldown', label: 'Bloodlust cooldown (s)', help: 'Unknown, guess 300s', min: 30 },
    ],
  },
  {
    group: 'Target / base stats',
    fields: [
      { key: 'targetLevel', label: 'Target level', help: '63 for raid bosses', min: 60, max: 63 },
      { key: 'targetArmor', label: 'Target armor', help: '3731 for most level 63 bosses (before debuffs)', min: 0 },
      { key: 'baseCritPct', label: 'Base melee crit %', help: 'Class base crit before agility', step: 0.1 },
      { key: 'baseSpellCritPct', label: 'Base spell crit %', help: 'Class base spell crit before intellect', step: 0.1 },
    ],
  },
]
