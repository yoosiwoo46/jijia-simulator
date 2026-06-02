import type { GameState } from '../types'
import { createInitialState } from '../core/constants'

const SAVE_KEY_PREFIX = 'chicken_rack_sim_save_'
const MAX_SLOTS = 5

function serializeState(state: GameState): string {
  const plain = {
    ...state,
    fulfilledOrders: state.fulfilledOrders instanceof Map
      ? Object.fromEntries(state.fulfilledOrders)
      : state.fulfilledOrders,
  }
  return JSON.stringify(plain)
}

function deserializeState(data: string): GameState {
  const parsed = JSON.parse(data)
  if (parsed.fulfilledOrders && !(parsed.fulfilledOrders instanceof Map)) {
    parsed.fulfilledOrders = new Map(Object.entries(parsed.fulfilledOrders).map(([k, v]) => [k, v as number]))
  }
  if (!parsed.fulfilledOrders) {
    parsed.fulfilledOrders = new Map()
  }
  const defaults = createInitialState()
  const result = { ...defaults, ...parsed }
  result.fulfilledOrders = parsed.fulfilledOrders instanceof Map ? parsed.fulfilledOrders : new Map(Object.entries(parsed.fulfilledOrders || {}))
  return result as GameState
}

export function saveGame(slot: number, state: GameState): void {
  if (slot < 0 || slot >= MAX_SLOTS) return
  try {
    const key = `${SAVE_KEY_PREFIX}${slot}`
    const serialized = serializeState(state)
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
    return deserializeState(data)
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
