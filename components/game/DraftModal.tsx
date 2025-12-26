"use client"

import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Coins, Hammer, Users, Trophy, X, Eye, EyeOff, GraduationCap } from "lucide-react"
import type { ResourceCost } from "@/game/types/game"
import { getDoorAfterRotation } from "@/game/engine/rotation"
import { calculateRotation } from "@/game/engine/rotation"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, Dice1 } from "lucide-react"
import { gameConfig } from "@/game/config"

export const DraftModal = observer(() => {
  const { state } = gameStore
  const [isHidden, setIsHidden] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState(1) // Default to center card
  const [focusOnReroll, setFocusOnReroll] = useState(false) // Track if reroll button is focused

  // Reset to center when draft options change
  React.useEffect(() => {
    if (state?.draftOptions) {
      setSelectedCardIndex(1)
      setFocusOnReroll(false)
    }
  }, [state?.draftOptions])

  // Keyboard controls for draft modal
  React.useEffect(() => {
    if (!state?.isDrafting) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC always toggles hide/show
      if (e.key === "Escape") {
        e.preventDefault()
        setIsHidden(!isHidden)
        return
      }

      // Other keys only work when dialog is visible
      if (isHidden) return

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          if (!focusOnReroll) {
            setSelectedCardIndex((prev) => Math.max(0, prev - 1))
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (!focusOnReroll) {
            setSelectedCardIndex((prev) => Math.min((state.draftOptions?.length || 3) - 1, prev + 1))
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (!focusOnReroll) {
            setFocusOnReroll(true)
          }
          break
        case "ArrowUp":
          e.preventDefault()
          if (focusOnReroll) {
            setFocusOnReroll(false)
            setSelectedCardIndex(1) // Return to center card
          }
          break
        case "Enter":
        case " ":
          e.preventDefault()
          if (focusOnReroll) {
            gameStore.rerollDraft()
          } else if (state.draftOptions?.[selectedCardIndex]) {
            gameStore.selectDraftTile(state.draftOptions[selectedCardIndex])
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state?.isDrafting, isHidden, selectedCardIndex, state?.draftOptions, focusOnReroll])

  if (!state || !state.isDrafting) return null

  const borderColorClasses: Record<string, string> = {
    starter: "border-gray-600",
    orange: "border-orange-600",
    green: "border-green-600",
    blue: "border-blue-600",
    purple: "border-purple-600",
  }

  const formatResourcesWithIcons = (resources: ResourceCost, isCost: boolean = false): React.ReactNode[] => {
    const resourceConfig: Record<
      string,
      { icon: React.ReactNode; color: string; label: string }
    > = {
      energy: {
        icon: <Zap className="w-4 h-4" />,
        color: "text-yellow-500",
        label: "Energy",
      },
      money: {
        icon: <Coins className="w-4 h-4" />,
        color: "text-green-500",
        label: "Money",
      },
      materials: {
        icon: <Hammer className="w-4 h-4" />,
        color: "text-blue-500",
        label: "Materials",
      },
      reputation: {
        icon: <Users className="w-4 h-4" />,
        color: "text-purple-500",
        label: "Reputation",
      },
      whitehats: {
        icon: <GraduationCap className="w-4 h-4" />,
        color: "text-white",
        label: "Whitehats",
      },
      vpFlat: {
        icon: <Trophy className="w-4 h-4" />,
        color: "text-orange-500",
        label: "VP",
      },
    }

    return Object.entries(resources)
      .filter(([_, value]) => value !== 0)
      .map(([key, value]) => {
        const config = resourceConfig[key]
        if (!config) return null

        const displayValue = isCost ? Math.abs(value) : value
        const sign = isCost ? "-" : value > 0 ? "+" : ""

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className={config.color}>{config.icon}</span>
            <span className="text-xs">
              {sign}
              {displayValue} {config.label}
            </span>
          </div>
        )
      })
      .filter(Boolean) as React.ReactNode[]
  }

  // Calculate rotation for preview (assuming entry from the direction we're moving)
  const getPreviewRotation = (tile: typeof state.draftOptions[0]) => {
    const direction = (state as any)["_draftDirection"] as "N" | "E" | "S" | "W" | undefined
    if (!direction) return 0
    const entryDir = direction === "N" ? "S" : direction === "S" ? "N" : direction === "E" ? "W" : "E"
    return calculateRotation(entryDir)
  }

  return (
    <>
      {/* Overlay when hidden - blocks all interaction but crystal clear */}
      {isHidden && (
        <div 
          className="fixed inset-0 z-[100] bg-transparent" 
          onClick={() => setIsHidden(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Main dialog - only show when not hidden */}
      {!isHidden && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Choose a Tile</h2>
              <p className="text-sm text-muted-foreground">Select one tile to place and enter. This cannot be undone.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsHidden(!isHidden)}
              className="flex items-center gap-2"
            >
              {isHidden ? (
                <>
                  <Eye className="w-4 h-4" />
                  Show
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide
                </>
              )}
            </Button>
          </div>

          {/* Cards Container */}
          {!isHidden && (
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              <div className="flex items-center justify-center gap-6 lg:gap-8 flex-wrap">
                {state.draftOptions.map((tile, index) => {
                  const rotation = getPreviewRotation(tile)
                  const doors = {
                    N: getDoorAfterRotation(tile.doors, rotation, "N"),
                    E: getDoorAfterRotation(tile.doors, rotation, "E"),
                    S: getDoorAfterRotation(tile.doors, rotation, "S"),
                    W: getDoorAfterRotation(tile.doors, rotation, "W"),
                  }
                  const isSelected = selectedCardIndex === index

                  const canAfford = state.resources.whitehats >= tile.draftingCost
                  
                  return (
                    <div key={`${tile.id}-${index}`} className="relative w-[350px] min-w-[280px] flex-shrink">
                      <Card
                        className={`${canAfford ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-50"} transition-all border-4 ${borderColorClasses[tile.color]} w-full flex flex-col h-[600px] ${
                          isSelected ? "ring-4 ring-primary ring-offset-2" : ""
                        }`}
                        onClick={() => canAfford && gameStore.selectDraftTile(tile)}
            >
              <div className="relative w-full h-48 rounded-t-lg overflow-hidden flex-shrink-0">
                <img
                  src={tile.backgroundImageUrl}
                  alt={tile.name}
                  className="w-full h-full object-cover"
                />
                        {/* Black overlay with 20% opacity */}
                        <div className="absolute inset-0 bg-black/20" />
                        
                        {/* Drafting cost in top-left */}
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 rounded-md px-2 py-1">
                          <span className="text-2xl font-bold text-white">{tile.draftingCost}</span>
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Door indicators - only show if arrowKeys feature is enabled */}
                        {gameConfig.features.arrowKeys && (
                          <>
                            {doors.N && (
                              <div className="absolute top-2 left-1/2 -translate-x-1/2">
                                <ChevronUp className="w-10 h-10 text-white drop-shadow-lg stroke-[3]" />
                              </div>
                            )}
                            {doors.S && (
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                                <ChevronDown className="w-10 h-10 text-white drop-shadow-lg stroke-[3]" />
                              </div>
                            )}
                            {doors.E && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <ChevronRight className="w-10 h-10 text-white drop-shadow-lg stroke-[3]" />
                              </div>
                            )}
                            {doors.W && (
                              <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <ChevronLeft className="w-10 h-10 text-white drop-shadow-lg stroke-[3]" />
                              </div>
                            )}
                          </>
                        )}
              </div>
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-sm font-medium">{tile.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 flex-1 overflow-y-auto">
                {/* Actions */}
                {tile.actions && tile.actions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">Actions:</h4>
                    {tile.actions.map((action) => (
                      <div key={action.id} className="text-xs space-y-1">
                        <div className="font-medium">{action.label}</div>
                        {action.cost && (
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-muted-foreground">Cost:</span>
                            {formatResourcesWithIcons(action.cost, true)}
                          </div>
                        )}
                        {action.effect && Object.keys(action.effect).length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-muted-foreground">Effect:</span>
                            {formatResourcesWithIcons(action.effect, false)}
                          </div>
                        )}
                        {action.vpFlat && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Trophy className="w-3 h-3 text-orange-500" />
                            <span>+{action.vpFlat} VP</span>
                          </div>
                        )}
                        {action.maxUses && (
                          <div className="text-xs text-muted-foreground">
                            (Up to {action.maxUses} times)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Passive Abilities */}
                {tile.passiveAbilities && tile.passiveAbilities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">Passive:</h4>
                    {tile.passiveAbilities.map((passive) => {
                      const colorNames: Record<string, string> = {
                        orange: "Orange",
                        green: "Green",
                        blue: "Blue",
                        purple: "Purple",
                      }
                      return (
                        <div key={passive.id} className="text-xs space-y-1">
                          <div className="font-medium">{passive.label}</div>
                          <div className="text-muted-foreground">
                            When placing {colorNames[passive.triggerColor]} tile:
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            {formatResourcesWithIcons(passive.reward, false)}
                            {passive.reward.vpFlat && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Trophy className="w-3 h-3 text-orange-500" />
                                <span>+{passive.reward.vpFlat} VP</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* VP Logic */}
                {tile.vpLogic && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">Victory Points:</h4>
                    <div className="text-xs space-y-1">
                      {tile.vpLogic.flat && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Trophy className="w-3 h-3 text-orange-500" />
                          <span>+{tile.vpLogic.flat} VP</span>
                        </div>
                      )}
                      {tile.vpLogic.perColorType &&
                        Object.entries(tile.vpLogic.perColorType).map(([color, vp]) => (
                          <div key={color} className="flex items-center gap-1.5 text-xs">
                            <Trophy className="w-3 h-3 text-orange-500" />
                            <span>
                              +{vp} VP per {color} tile
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Quest */}
                {tile.quest && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">Quest:</h4>
                    <div className="text-xs space-y-1">
                      <div className="font-medium">{tile.quest.label}</div>
                      <div className="text-muted-foreground">{tile.quest.description}</div>
                      {tile.quest.reward && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                          <span className="text-muted-foreground">Reward:</span>
                          {formatResourcesWithIcons(tile.quest.reward, false)}
                          {tile.quest.reward.vpFlat && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Trophy className="w-3 h-3 text-orange-500" />
                              <span>+{tile.quest.reward.vpFlat} VP</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                      <Button className="w-full mt-4 flex-shrink-0" size="sm">
                  Select
                </Button>
                    </CardContent>
                    </Card>
                    {/* Selection indicator arrow */}
                    {isSelected && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <ArrowUp className="w-6 h-6 text-primary animate-bounce" />
                        <span className="text-xs text-primary font-medium mt-1">Selected</span>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
              
              {/* Reroll Button */}
              <div className="flex justify-center mt-4">
                {(() => {
                  const rerollCount = state.draftRerollCount || 0
                  const rerollCost = rerollCount + 1
                  const canReroll = rerollCount < 3 && state.resources.energy >= rerollCost
                  const isRerollFocused = focusOnReroll
                  
                  return (
                    <Button
                      className={`${isRerollFocused ? "ring-4 ring-primary ring-offset-2" : ""}`}
                      variant={canReroll ? "default" : "outline"}
                      disabled={!canReroll}
                      onClick={() => gameStore.rerollDraft()}
                      ref={(el) => {
                        if (isRerollFocused && el) {
                          el.scrollIntoView({ behavior: "smooth", block: "nearest" })
                        }
                      }}
                    >
                      <Dice1 className="w-4 h-4 mr-2" />
                      Reroll ({rerollCost})
                      {rerollCount >= 3 && <span className="ml-2 text-xs">(Max reached)</span>}
                    </Button>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  )
})

DraftModal.displayName = "DraftModal"
