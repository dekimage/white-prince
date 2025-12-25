"use client"

import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isAdjacent, getDirectionBetween } from "@/game/engine/movement"
import { getDoorAfterRotation } from "@/game/engine/rotation"
import { Move } from "lucide-react"
import type { Direction } from "@/game/types/game"

export const TileDetailsPanel = observer(() => {
  const { selectedTile, currentTile, state } = gameStore

  if (!selectedTile) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Select a tile to view details</p>
      </div>
    )
  }

  const isCurrentTile =
    currentTile?.position.x === selectedTile.position.x && currentTile?.position.y === selectedTile.position.y

  // Check if we can move to this tile
  const canMoveToTile = (): boolean => {
    if (!currentTile || !state) return false
    if (isCurrentTile) return false // Already here
    if (state.gameStatus !== "playing") return false
    if (state.isDrafting) return false
    if (state.resources.energy < 1) return false

    // Check if adjacent
    if (!isAdjacent(state.playerPosition, selectedTile.position)) return false

    // Get direction
    const direction = getDirectionBetween(state.playerPosition, selectedTile.position)
    if (!direction) return false

    // Check if current tile has exit door
    const hasExitDoor = getDoorAfterRotation(currentTile.template.doors, currentTile.rotation, direction)
    if (!hasExitDoor) return false

    // Check if target tile has entrance door
    const oppositeDirMap: Record<Direction, Direction> = { N: "S", S: "N", E: "W", W: "E" }
    const oppositeDir = oppositeDirMap[direction]
    const hasEntranceDoor = getDoorAfterRotation(selectedTile.template.doors, selectedTile.rotation, oppositeDir)
    if (!hasEntranceDoor) return false

    return true
  }

  const handleMove = () => {
    if (canMoveToTile()) {
      gameStore.moveToTile(selectedTile.position)
    }
  }

  const colorClasses: Record<string, string> = {
    starter: "bg-gray-600",
    orange: "bg-orange-600",
    green: "bg-green-600",
    blue: "bg-blue-600",
    purple: "bg-purple-600",
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Tile image */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-border">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${selectedTile.template.backgroundImageUrl})` }}
        />
        <div className={`absolute inset-0 ${colorClasses[selectedTile.template.color]} opacity-40`} />
      </div>

      {/* Tile info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedTile.template.name}
            <Badge variant="secondary">{selectedTile.template.type}</Badge>
          </CardTitle>
          <CardDescription>{selectedTile.template.description}</CardDescription>
        </CardHeader>

        {/* Move button */}
        {!isCurrentTile && (
          <CardContent>
            <Button
              className="w-full"
              variant={canMoveToTile() ? "default" : "outline"}
              disabled={!canMoveToTile()}
              onClick={handleMove}
            >
              <Move className="w-4 h-4 mr-2" />
              Move Here (1 Energy)
            </Button>
            {!canMoveToTile() && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {!isAdjacent(state.playerPosition, selectedTile.position)
                  ? "Not adjacent"
                  : state.resources.energy < 1
                    ? "Not enough energy"
                    : "No connecting door"}
              </p>
            )}
          </CardContent>
        )}

        {selectedTile.template.actions && selectedTile.template.actions.length > 0 && (
          <CardContent className="space-y-2">
            <h4 className="font-medium text-sm mb-2">Actions</h4>
            {selectedTile.template.actions.map((action) => {
              const isClaimed = selectedTile.claimedActions.includes(action.id)
              const canUse = isCurrentTile && !isClaimed && state.gameStatus === "playing"

              return (
                <Card key={action.id} className={isClaimed ? "opacity-50" : ""}>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{action.label}</CardTitle>
                    <CardDescription className="text-xs">{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {action.cost && (
                      <div className="text-xs text-muted-foreground">Cost: {formatResources(action.cost)}</div>
                    )}
                    {action.effect && Object.keys(action.effect).length > 0 && (
                      <div className="text-xs text-muted-foreground">Effect: {formatResources(action.effect)}</div>
                    )}
                    {action.vpFlat && <div className="text-xs text-muted-foreground">VP: +{action.vpFlat}</div>}
                    <Button size="sm" className="w-full" disabled={!canUse} onClick={() => gameStore.claimAction(action.id)}>
                      {isClaimed ? "Used" : isCurrentTile ? "Use" : "Not Here"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        )}

        {selectedTile.template.vpLogic && (
          <CardContent>
            <h4 className="font-medium text-sm mb-2">Victory Points</h4>
            <div className="text-xs space-y-1">
              {selectedTile.template.vpLogic.flat && <div>Flat: +{selectedTile.template.vpLogic.flat} VP</div>}
              {selectedTile.template.vpLogic.perColorType &&
                Object.entries(selectedTile.template.vpLogic.perColorType).map(([color, vp]) => (
                  <div key={color}>
                    +{vp} VP per {color} tile
                  </div>
                ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
})

TileDetailsPanel.displayName = "TileDetailsPanel"

function formatResources(resources: Record<string, number>): string {
  return Object.entries(resources)
    .filter(([_, value]) => value !== 0)
    .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${key}`)
    .join(", ")
}
