"use client"

import { observer } from "mobx-react-lite"
import type { PlacedTile, Position } from "@/game/types/game"
import { getDoorAfterRotation } from "@/game/engine/rotation"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

interface GridCellProps {
  tile: PlacedTile | null
  position: Position
  isPlayerHere: boolean
  isSelected: boolean
  onClick: () => void
}

export const GridCell = observer(({ tile, position, isPlayerHere, isSelected, onClick }: GridCellProps) => {
  if (!tile) {
    // Empty cell
    return (
      <button
        className="relative w-full aspect-square border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-muted-foreground/40 transition-colors"
        onClick={onClick}
      >
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs">???</div>
      </button>
    )
  }

  // Get rotated doors
  const doors = {
    N: getDoorAfterRotation(tile.template.doors, tile.rotation, "N"),
    E: getDoorAfterRotation(tile.template.doors, tile.rotation, "E"),
    S: getDoorAfterRotation(tile.template.doors, tile.rotation, "S"),
    W: getDoorAfterRotation(tile.template.doors, tile.rotation, "W"),
  }

  // Color mapping
  const colorClasses: Record<string, string> = {
    starter: "bg-gray-600",
    orange: "bg-orange-600",
    green: "bg-green-600",
    blue: "bg-blue-600",
    purple: "bg-purple-600",
  }

  return (
    <button
      className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
        isSelected ? "border-primary ring-2 ring-primary" : "border-border"
      } hover:border-primary/60`}
      onClick={onClick}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${tile.template.backgroundImageUrl})` }}
      />

      {/* Dark overlay */}
      <div className={`absolute inset-0 ${colorClasses[tile.template.color]} opacity-60`} />

      {/* Corner brackets */}
      <div className="absolute inset-0 p-1">
        <div className="relative w-full h-full">
          {/* Top-left */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/60" />
          {/* Top-right */}
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/60" />
          {/* Bottom-left */}
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/60" />
          {/* Bottom-right */}
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/60" />
        </div>
      </div>

      {/* Door indicators */}
      {doors.N && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <ChevronUp className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      )}
      {doors.S && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      )}
      {doors.E && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <ChevronRight className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      )}
      {doors.W && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <ChevronLeft className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      )}

      {/* Player avatar */}
      {isPlayerHere && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg flex items-center justify-center text-xl">
            👤
          </div>
        </div>
      )}

      {/* Tile name */}
      <div className="absolute bottom-1 left-1 right-1 text-center">
        <div className="bg-black/50 px-1 py-0.5 rounded text-white text-[10px] font-medium truncate">
          {tile.template.name}
        </div>
      </div>
    </button>
  )
})

GridCell.displayName = "GridCell"
