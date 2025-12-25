import type { PlacedTile, GameResources } from "../types/game"

export function calculateVictoryPoints(grid: (PlacedTile | null)[][], resources: GameResources): number {
  let totalVP = 0

  // Count tiles by color
  const colorCounts: Record<string, number> = {
    orange: 0,
    green: 0,
    blue: 0,
    purple: 0,
  }

  // Flatten grid and count
  const placedTiles = grid.flat().filter((t) => t !== null) as PlacedTile[]

  placedTiles.forEach((tile) => {
    if (tile.template.color !== "starter") {
      colorCounts[tile.template.color] = (colorCounts[tile.template.color] || 0) + 1
    }

    const vpLogic = tile.template.vpLogic
    if (vpLogic) {
      // Flat VP
      if (vpLogic.flat) {
        totalVP += vpLogic.flat
      }

      // VP per color type
      if (vpLogic.perColorType) {
        Object.entries(vpLogic.perColorType).forEach(([color, vpPerTile]) => {
          totalVP += (colorCounts[color] || 0) * vpPerTile
        })
      }
    }
  })

  return totalVP
}
