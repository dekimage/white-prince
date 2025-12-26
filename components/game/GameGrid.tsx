"use client"

import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import { GridCell } from "./GridCell"
import { GRID_WIDTH } from "@/game/types/game"

export const GameGrid = observer(() => {
  const { state } = gameStore

  if (!state || !state.grid) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full p-4 overflow-auto">
      <div
        className="grid gap-3 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
          maxWidth: `${GRID_WIDTH * 150}px`,
        }}
      >
        {state.grid
          .filter((_, y) => y >= 2) // Skip top 2 rows (y < 2)
          .map((row, rowIndex) => {
            const y = rowIndex + 2 // Adjust y index since we filtered
            return row.map((tile, x) => {
            const position = { x, y }
              const isPlayerHere = state.playerPosition?.x === x && state.playerPosition?.y === y
            const isSelected = state.selectedTilePosition?.x === x && state.selectedTilePosition?.y === y

            return (
              <GridCell
                key={`${x}-${y}`}
                tile={tile}
                position={position}
                isPlayerHere={isPlayerHere}
                isSelected={isSelected}
                  onClick={() => gameStore.selectTile(position)}
              />
            )
            })
          })
          .flat()}
      </div>
    </div>
  )
})

GameGrid.displayName = "GameGrid"
