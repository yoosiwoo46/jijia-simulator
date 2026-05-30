import type { GameState } from '../types'

const SAVE_KEY_PREFIX = 'chicken_rack_sim_save_'
const MAX_SLOTS = 5

export function saveGame(slot: number, state: GameState): void {
  if (slot < 0 || slot >= MAX_SLOTS) return
  try {
    const key = `${SAVE_KEY_PREFIX}${slot}`
    const serialized = JSON.stringify(state)
    localStorage.setItem(key, serialized)
  } catch {
    console.error(`Failed to save game to slot ${slot}`)
  }
}

export function loadGame(slot: number): GameState | null {
  if (slot < 0 || slot >= MAX_SLOTS) return null
  try {
    const key = `${SAVE_KEY_PREFIX}${slot}`
    const data = localStorage.getItem(key)
    if (!data) return null
    return JSON.parse(data) as GameState
  } catch {
    return null
  }
}

export function getSaveSlots(): (GameState | null)[] {
  const slots: (GameState | null)[] = []
  for (let i = 0; i < MAX_SLOTS; i++) {
    slots.push(loadGame(i))
  }
  return slots
}

export function deleteSave(slot: number): void {
  if (slot < 0 || slot >= MAX_SLOTS) return
  const key = `${SAVE_KEY_PREFIX}${slot}`
  localStorage.removeItem(key)
}
