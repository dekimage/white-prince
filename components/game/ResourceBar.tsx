"use client"

import type React from "react"

import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import { Zap, Coins, Hammer, Users, Trophy } from "lucide-react"

export const ResourceBar = observer(() => {
  const { state, victoryPoints, tilesPlaced } = gameStore

  if (!state || !state.resources) {
    return <div className="flex items-center gap-4">Loading...</div>
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <ResourceItem
        icon={<Zap className="w-4 h-4" />}
        label="Energy"
        value={state.resources.energy}
        color="text-yellow-500"
      />
      <ResourceItem
        icon={<Coins className="w-4 h-4" />}
        label="Money"
        value={state.resources.money}
        color="text-green-500"
      />
      <ResourceItem
        icon={<Hammer className="w-4 h-4" />}
        label="Materials"
        value={state.resources.materials}
        color="text-blue-500"
      />
      <ResourceItem
        icon={<Users className="w-4 h-4" />}
        label="Reputation"
        value={state.resources.reputation}
        color="text-purple-500"
      />
      <div className="h-6 w-px bg-border" />
      <ResourceItem
        icon={<Trophy className="w-4 h-4" />}
        label="Victory Points"
        value={victoryPoints}
        color="text-orange-500"
      />
      <div className="text-sm text-muted-foreground">Tiles: {tilesPlaced}/40</div>
    </div>
  )
})

ResourceBar.displayName = "ResourceBar"

function ResourceItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={color}>{icon}</div>
      <span className="text-sm font-medium">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  )
}
