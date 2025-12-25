"use client";

import { observer } from "mobx-react-lite";
import type { PlacedTile, Position } from "@/game/types/game";
import { getDoorAfterRotation } from "@/game/engine/rotation";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
} from "lucide-react";
import { gameStore } from "@/game/store/GameStore";

interface GridCellProps {
  tile: PlacedTile | null;
  position: Position;
  isPlayerHere: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const GridCell = observer(
  ({ tile, position, isPlayerHere, isSelected, onClick }: GridCellProps) => {
    if (!tile) {
      // Empty cell
      return (
        <button
          className="relative w-full aspect-square border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-muted-foreground/40 transition-colors"
          onClick={onClick}
        >
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs">
            ???
          </div>
        </button>
      );
    }

    // Get rotated doors
    const doors = {
      N: getDoorAfterRotation(tile.template.doors, tile.rotation, "N"),
      E: getDoorAfterRotation(tile.template.doors, tile.rotation, "E"),
      S: getDoorAfterRotation(tile.template.doors, tile.rotation, "S"),
      W: getDoorAfterRotation(tile.template.doors, tile.rotation, "W"),
    };

    // Border color mapping
    const borderColorClasses: Record<string, string> = {
      starter: "border-gray-600",
      orange: "border-orange-600",
      green: "border-green-600",
      blue: "border-blue-600",
      purple: "border-purple-600",
    };

    // Check tile completion status
    const isComplete = tile ? gameStore.isTileComplete(tile) : false;
    const hasUnusedActions = tile ? gameStore.hasUnusedActions(tile) : false;

    return (
      <button
        className={`relative w-full aspect-square rounded-lg overflow-hidden border-4 transition-all ${
          isSelected ? "ring-2 ring-primary" : ""
        } ${borderColorClasses[tile.template.color]} hover:opacity-80`}
        onClick={onClick}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${tile.template.backgroundImageUrl})`,
          }}
        />
        {/* Black overlay with 20% opacity */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Door indicators */}
        {doors.N && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <ChevronUp className="w-8 h-8 text-white drop-shadow-lg stroke-[3]" />
          </div>
        )}
        {doors.S && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <ChevronDown className="w-8 h-8 text-white drop-shadow-lg stroke-[3]" />
          </div>
        )}
        {doors.E && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <ChevronRight className="w-8 h-8 text-white drop-shadow-lg stroke-[3]" />
          </div>
        )}
        {doors.W && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg stroke-[3]" />
          </div>
        )}

        {/* Player avatar */}
        {isPlayerHere && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg flex items-center justify-center text-4xl">
              👤
            </div>
          </div>
        )}

        {/* Action status indicators */}
        {tile.template.actions && tile.template.actions.length > 0 && (
          <div className="absolute top-1 right-1 z-10">
            {isComplete ? (
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : hasUnusedActions ? (
              <div
                className="w-4 h-4 bg-yellow-500 flex items-center justify-center shadow-md"
                style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
              >
                <span className="text-[10px] text-white font-bold leading-none">
                  !
                </span>
              </div>
            ) : null}
          </div>
        )}
      </button>
    );
  }
);

GridCell.displayName = "GridCell";
