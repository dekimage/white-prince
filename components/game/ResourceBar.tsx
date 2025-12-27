"use client"

import type React from "react"

import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import { Zap, Coins, Hammer, Users, Trophy, GraduationCap } from "lucide-react"

export const ResourceBar = observer(() => {
  const { state, victoryPoints, tilesPlaced } = gameStore

  if (!state || !state.resources) {
    return <div className="flex items-center gap-4">Loading...</div>
  }

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <ResourceItem
        icon={<Zap className="w-6 h-6" />}
        label="Energy"
        value={state.resources.energy}
        color="text-yellow-500"
      />
      <ResourceItem
        icon={<Coins className="w-6 h-6" />}
        label="Money"
        value={state.resources.money}
        color="text-green-500"
      />
      <ResourceItem
        icon={<Hammer className="w-6 h-6" />}
        label="Materials"
        value={state.resources.materials}
        color="text-blue-500"
      />
      <ResourceItem
        icon={<Users className="w-6 h-6" />}
        label="Reputation"
        value={state.resources.reputation}
        color="text-purple-500"
      />
      <ResourceItem
        icon={<GraduationCap className="w-6 h-6" />}
        label="Whitehats"
        value={state.resources.whitehats}
        color="text-white"
      />
      <div className="h-6 w-px bg-border" />
      <ResourceItem
        icon={<Trophy className="w-6 h-6" />}
        label="Victory Points"
        value={`${victoryPoints}/100`}
        color="text-orange-500"
        isVP={true}
      />
    </div>
  )
})

ResourceBar.displayName = "ResourceBar"

function ResourceItem({
  icon,
  label,
  value,
  color,
  isVP = false,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  isVP?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={color}>{icon}</div>
      <span className={`text-2xl font-bold ${color}`} style={{ fontSize: '24px', fontWeight: 700 }}>
        {value}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  )
}
