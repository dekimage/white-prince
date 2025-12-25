import type { TileTemplate } from "../types/game"
import { TILE_DECK } from "../data/tiles"

export function getRandomTiles(count: number): TileTemplate[] {
  const result: TileTemplate[] = []
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * TILE_DECK.length)
    result.push(TILE_DECK[randomIndex])
  }
  return result
}
