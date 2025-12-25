import { type Position, type Direction, GRID_WIDTH, GRID_HEIGHT } from "../types/game"

export function getAdjacentPosition(pos: Position, direction: Direction): Position | null {
  const newPos = { ...pos }

  switch (direction) {
    case "N":
      newPos.y -= 1
      break
    case "S":
      newPos.y += 1
      break
    case "E":
      newPos.x += 1
      break
    case "W":
      newPos.x -= 1
      break
  }

  // Check bounds
  if (newPos.x < 0 || newPos.x >= GRID_WIDTH || newPos.y < 0 || newPos.y >= GRID_HEIGHT) {
    return null
  }

  return newPos
}

export function getDirectionBetween(from: Position, to: Position): Direction | null {
  const dx = to.x - from.x
  const dy = to.y - from.y

  if (Math.abs(dx) + Math.abs(dy) !== 1) {
    return null // Not adjacent
  }

  if (dy === -1) return "N"
  if (dy === 1) return "S"
  if (dx === 1) return "E"
  if (dx === -1) return "W"

  return null
}

export function isAdjacent(pos1: Position, pos2: Position): boolean {
  const dx = Math.abs(pos1.x - pos2.x)
  const dy = Math.abs(pos1.y - pos2.y)
  return dx + dy === 1
}
