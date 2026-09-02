import { SLOT_ACCEPTS, type Gear, type GearSlot, type Item, type ItemDb } from './types'

export function itemsForSlot(db: ItemDb, slot: GearSlot, gear: Gear): Item[] {
  const accepts = SLOT_ACCEPTS[slot]
  let list = db.items.filter((i) => accepts.includes(i.slot) && i.reqLevel <= 60 && i.quality >= 2 && i.slot !== 'Shirt')
  if (slot === 'offHand') {
    // shields only unless the main hand is a one-hander
    list = list.filter((i) => i.type === 'Shield' || i.slot === 'Held In Off-hand')
  }
  if (slot === 'mainHand') list = list.filter((i) => i.dmgMin !== undefined)
  if (slot === 'offHand') {
    const mh = gear.mainHand !== undefined ? db.items.find((i) => i.id === gear.mainHand) : undefined
    if (mh?.slot === 'Two-Hand') list = []
  }
  return list
}
