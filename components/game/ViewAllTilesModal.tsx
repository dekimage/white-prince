"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { TileCard } from "./TileCard";
import { STARTER_TILE, TILE_DECK } from "@/game/data/tiles";
import type { TileTemplate } from "@/game/types/game";

interface ViewAllTilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ViewAllTilesModal: React.FC<ViewAllTilesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  if (!isOpen) return null;

  // Combine starter tile with deck
  const allTiles: TileTemplate[] = [STARTER_TILE, ...TILE_DECK];

  // Filter by color if selected
  const filteredTiles = selectedColor
    ? allTiles.filter((tile) => tile.color === selectedColor)
    : allTiles;

  // Sort by drafting cost (ascending)
  const sortedTiles = [...filteredTiles].sort(
    (a, b) => a.draftingCost - b.draftingCost
  );

  // Get unique colors
  const colors = Array.from(new Set(allTiles.map((tile) => tile.color)));

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-2xl font-bold">All Tiles</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Color Filter */}
      <div className="flex items-center gap-2 p-4 border-b flex-wrap">
        <span className="text-sm font-medium">Filter:</span>
        <Button
          variant={selectedColor === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedColor(null)}
        >
          All
        </Button>
        {colors.map((color) => (
          <Button
            key={color}
            variant={selectedColor === color ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedColor(color)}
          >
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tiles Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-[1800px] mx-auto">
          {sortedTiles.map((tile) => (
            <div key={tile.id} className="w-full" style={{ height: "300px" }}>
              <TileCard tile={tile} scale={0.5} showDoors={true} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
