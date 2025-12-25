import type { Doors, Direction } from "../types/game"

// Get opposite direction
export function getOppositeDirection(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    N: "S",
    S: "N",
    E: "W",
    W: "E",
  }
  return opposites[dir]
}

// Rotate doors by given degrees (0, 90, 180, 270)
export function rotateDoors(doors: Doors, rotation: number): Doors {
  const rotations = rotation / 90
  let result = { ...doors }

  for (let i = 0; i < rotations; i++) {
    result = {
      N: result.W,
      E: result.N,
      S: result.E,
      W: result.S,
    }
  }

  return result
}

// Calculate rotation needed so that tile's SOUTH door faces the entry direction
export function calculateRotation(entryDirection: Direction): number {
  const rotationMap: Record<Direction, number> = {
    S: 0, // Entry from north → tile's S faces N → no rotation
    W: 90, // Entry from east → tile's S faces E → 90° clockwise
    N: 180, // Entry from south → tile's S faces S → 180°
    E: 270, // Entry from west → tile's S faces W → 270° clockwise
  }
  return rotationMap[entryDirection]
}

// Get door in a direction after rotation
export function getDoorAfterRotation(doors: Doors, rotation: number, direction: Direction): boolean {
  const rotated = rotateDoors(doors, rotation)
  return rotated[direction]
}
