"use client"

import React from "react"
import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isAdjacent, getDirectionBetween } from "@/game/engine/movement"
import { getDoorAfterRotation } from "@/game/engine/rotation"
import { gameConfig } from "@/game/config"
import { Move, Zap, Coins, Hammer, Users, Trophy, GraduationCap } from "lucide-react"
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

    // If arrowKeys feature is enabled, check doors. Otherwise, allow free movement
    if (gameConfig.features.arrowKeys) {
      // Check if current tile has exit door
      const hasExitDoor = getDoorAfterRotation(currentTile.template.doors, currentTile.rotation, direction)
      if (!hasExitDoor) return false

      // Check if target tile has entrance door
      const oppositeDirMap: Record<Direction, Direction> = { N: "S", S: "N", E: "W", W: "E" }
      const oppositeDir = oppositeDirMap[direction]
      const hasEntranceDoor = getDoorAfterRotation(selectedTile.template.doors, selectedTile.rotation, oppositeDir)
      if (!hasEntranceDoor) return false
    }

    return true
  }

  const handleMove = () => {
    if (canMoveToTile()) {
      gameStore.moveToTile(selectedTile.position)
    }
  }

  const borderColorClasses: Record<string, string> = {
    starter: "border-gray-600",
    orange: "border-orange-600",
    green: "border-green-600",
    blue: "border-blue-600",
    purple: "border-purple-600",
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Tile image */}
      <div className={`relative w-full aspect-square rounded-lg overflow-hidden border-4 ${borderColorClasses[selectedTile.template.color]}`}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${selectedTile.template.backgroundImageUrl})` }}
        />
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
                    : gameConfig.features.arrowKeys
                      ? "No connecting door"
                      : "Cannot move"}
              </p>
            )}
          </CardContent>
        )}

        {selectedTile.template.actions && selectedTile.template.actions.length > 0 && (
          <CardContent className="space-y-4">
            {selectedTile.template.actions.map((action, actionIndex) => {
              const usage = gameStore.getActionUsage(selectedTile, action.id)
              const isClaimed = !action.maxUses && selectedTile.claimedActions.includes(action.id)
              const hasEnoughResources = !action.cost || gameStore.canAfford(action.cost)
              const missingResources = action.cost ? gameStore.getMissingResources(action.cost) : {}
              const canUse = isCurrentTile && !usage.isComplete && state.gameStatus === "playing" && hasEnoughResources
              const isFocused = state.focusMode === "details" && (state.focusedActionIndex || 0) === actionIndex

              return (
                <div key={action.id} className={`space-y-2 ${usage.isComplete ? "opacity-50" : ""} ${isFocused ? "ring-2 ring-primary rounded-lg p-2 -m-2" : ""}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-base">{action.label}</h4>
                    {action.maxUses && (
                      <span className="text-base text-muted-foreground">
                        {usage.current}/{usage.max} uses
                      </span>
                    )}
                  </div>
                  <p className="text-base text-muted-foreground">{action.description}</p>
                  
                  {action.cost && (
                    <div className="flex items-center gap-2 text-base">
                      <span className="text-muted-foreground">Cost:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {formatResourcesWithIcons(action.cost, true)}
                      </div>
                    </div>
                  )}
                  {(action.effect && Object.keys(action.effect).length > 0) || action.vpFlat ? (
                    <div className="flex items-center gap-2 text-base">
                      <span className="text-muted-foreground">Reward:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {action.effect && Object.keys(action.effect).length > 0 && formatResourcesWithIcons(action.effect, false)}
                        {/* Legacy support: Show vpFlat from separate property if not in effect */}
                        {action.vpFlat && !action.effect?.vpFlat && (
                          <div className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-orange-500" />
                            <span className="text-base">+{action.vpFlat} VP</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                  
                  <Button 
                    size="sm" 
                    className={`w-full ${isFocused ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    disabled={!canUse} 
                    onClick={() => gameStore.claimAction(action.id)}
                    ref={(el) => {
                      if (isFocused && el) {
                        el.scrollIntoView({ behavior: "smooth", block: "nearest" })
                      }
                    }}
                  >
                    {usage.isComplete
                      ? "Complete"
                      : isCurrentTile
                        ? action.maxUses
                          ? `Use (${usage.current}/${usage.max})`
                          : "Use"
                        : "Not Here"}
                  </Button>
                  {!canUse && isCurrentTile && !usage.isComplete && !hasEnoughResources && Object.keys(missingResources).length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-destructive mt-1">
                      <span>Missing:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {formatResourcesWithIcons(missingResources, true)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        )}

        {selectedTile.template.quest && (
          <CardContent className="space-y-2">
            <h4 className="font-medium text-base mb-2">Quest</h4>
            {(() => {
              const questProgress = gameStore.getQuestProgress(selectedTile)
              if (!questProgress) return null

              return (
                <div className="space-y-2">
                  <div>
                    <div className="font-medium text-base">{selectedTile.template.quest.label}</div>
                    <p className="text-base text-muted-foreground">{selectedTile.template.quest.description}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-muted-foreground">Progress:</span>
                      <span className={`font-bold ${questProgress.isComplete ? "text-green-500" : ""}`}>
                        {questProgress.current}/{questProgress.max}
                      </span>
                    </div>
                    {questProgress.isComplete && (
                      <div className="text-base text-green-500 font-medium">✓ Quest Completed!</div>
                    )}
                    {selectedTile.template.quest.reward && (
                      <div className="flex items-center gap-2 text-base">
                        <span className="text-muted-foreground">Reward:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {formatResourcesWithIcons(selectedTile.template.quest.reward, false)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </CardContent>
        )}

        {selectedTile.template.passiveAbilities && selectedTile.template.passiveAbilities.length > 0 && (
          <CardContent className="space-y-2">
            <h4 className="font-medium text-sm mb-2">Passive Abilities</h4>
            {selectedTile.template.passiveAbilities.map((passive) => {
              const colorNames: Record<string, string> = {
                orange: "Orange",
                green: "Green",
                blue: "Blue",
                purple: "Purple",
              }

              return (
                <Card key={passive.id} className="bg-muted/50">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{passive.label}</CardTitle>
                    <CardDescription className="text-xs">{passive.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xs space-y-1.5">
                      <div className="text-muted-foreground">
                        Trigger: Place a <span className="font-medium">{colorNames[passive.triggerColor]}</span> tile
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Reward:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {formatResourcesWithIcons(passive.reward, false)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        )}

        {selectedTile.template.vpLogic && (
          <CardContent>
            <h4 className="font-medium text-sm mb-2">Victory Points</h4>
            <div className="text-xs space-y-1.5">
              {selectedTile.template.vpLogic.flat && (
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-orange-500" />
                  <span>Flat: +{selectedTile.template.vpLogic.flat} VP</span>
                </div>
              )}
              {selectedTile.template.vpLogic.perColorType &&
                Object.entries(selectedTile.template.vpLogic.perColorType).map(([color, vp]) => (
                  <div key={color} className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-orange-500" />
                    <span>
                    +{vp} VP per {color} tile
                    </span>
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

function formatResourcesWithIcons(resources: Record<string, number>, isCost: boolean = false): React.ReactNode[] {
  const resourceConfig: Record<
    string,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    energy: {
      icon: <Zap className="w-7 h-7" />,
      color: "text-yellow-500",
      label: "Energy",
    },
    money: {
      icon: <Coins className="w-7 h-7" />,
      color: "text-green-500",
      label: "Money",
    },
    materials: {
      icon: <Hammer className="w-7 h-7" />,
      color: "text-blue-500",
      label: "Materials",
    },
    reputation: {
      icon: <Users className="w-7 h-7" />,
      color: "text-purple-500",
      label: "Reputation",
    },
    whitehats: {
      icon: <GraduationCap className="w-7 h-7" />,
      color: "text-white",
      label: "Whitehats",
    },
    vpFlat: {
      icon: <Trophy className="w-7 h-7" />,
      color: "text-orange-500",
      label: "VP",
    },
  }

  return Object.entries(resources)
    .filter(([_, value]) => value !== 0)
    .map(([key, value]) => {
      const config = resourceConfig[key]
      if (!config) return null

      // For costs, always show as negative (spending)
      // For effects, show positive with + sign (gaining)
        const displayValue = isCost ? Math.abs(value) : value
        const sign = isCost ? "-" : value > 0 ? "+" : ""

        return (
          <div key={key} className="flex items-center gap-2">
            <span className={config.color}>{config.icon}</span>
            <span className="text-base">
              {sign}
              {displayValue} {config.label}
            </span>
          </div>
        )
    })
    .filter(Boolean) as React.ReactNode[]
}
