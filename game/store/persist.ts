import type { GameState } from "../types/game"

const STORAGE_KEY = "tile-game-save"
const STORAGE_VERSION = "1.0"

export function saveGameState(state: GameState) {
  try {
    const saveData = {
      version: STORAGE_VERSION,
      state,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
  } catch (error) {
    console.error("[v0] Failed to save game:", error)
  }
}

export function loadGameState(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null

    const saveData = JSON.parse(saved)

    // Version check
    if (saveData.version !== STORAGE_VERSION) {
      console.log("[v0] Save version mismatch, discarding")
      clearGameState()
      return null
    }

    return saveData.state
  } catch (error) {
    console.error("[v0] Failed to load game:", error)
    return null
  }
}

export function clearGameState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("[v0] Failed to clear save:", error)
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}
