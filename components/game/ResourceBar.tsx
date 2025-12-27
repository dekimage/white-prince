"use client"

import React, { useEffect, useState, useRef } from "react"
import { observer } from "mobx-react-lite"
import { reaction } from "mobx"
import { gameStore } from "@/game/store/GameStore"
import { Zap, Coins, Hammer, Users, Trophy, GraduationCap, ArrowUp, ArrowDown } from "lucide-react"
import type { ResourceCost } from "@/game/types/game"

interface ResourceChange {
  resource: keyof ResourceCost | "vpFlat" | "energy" | "money" | "materials" | "reputation" | "whitehats";
  change: number;
  timestamp: number;
  startValue: number;
  endValue: number;
}

export const ResourceBar = observer(() => {
  const { state, victoryPoints, tilesPlaced } = gameStore
  const [resourceChanges, setResourceChanges] = useState<Map<string, ResourceChange>>(new Map())
  const [animatedValues, setAnimatedValues] = useState<Map<string, number>>(new Map())
  const lastResourcesRef = useRef<Record<string, number>>({})
  const isInitialMountRef = useRef(true)

  // Initialize last resources on mount
  useEffect(() => {
    if (state?.resources) {
      lastResourcesRef.current = {
        energy: state.resources.energy,
        money: state.resources.money,
        materials: state.resources.materials,
        reputation: state.resources.reputation,
        whitehats: state.resources.whitehats,
        vpFlat: victoryPoints,
      }
      isInitialMountRef.current = false
    }
  }, [])

  // Track resource changes by watching resources directly
  useEffect(() => {
    if (!state?.resources || isInitialMountRef.current) return

    const currentResources = {
      energy: state.resources.energy,
      money: state.resources.money,
      materials: state.resources.materials,
      reputation: state.resources.reputation,
      whitehats: state.resources.whitehats,
      vpFlat: victoryPoints,
    }

    const lastResources = lastResourcesRef.current
    const changes = new Map<string, ResourceChange>()

    // Check each resource for changes
    Object.keys(currentResources).forEach((key) => {
      const resourceKey = key as keyof typeof currentResources
      const current = currentResources[resourceKey]
      const last = lastResources[resourceKey] || 0
      const change = current - last

        if (change !== 0 && Math.abs(change) > 0) {
          changes.set(resourceKey, {
            resource: resourceKey,
            change: change,
            timestamp: Date.now(),
            startValue: last,
            endValue: current,
          })

          // Start animated counting
          animateValue(resourceKey, last, current)
        }
    })

    // Update last resources
    lastResourcesRef.current = currentResources

    if (changes.size > 0) {
      setResourceChanges((prev) => {
        const newMap = new Map(prev)
        changes.forEach((change, key) => {
          newMap.set(key, change)
        })
        return newMap
      })

      // Remove changes after 3 seconds
      setTimeout(() => {
        setResourceChanges((prev) => {
          const newMap = new Map(prev)
          changes.forEach((_, key) => {
            newMap.delete(key)
          })
          return newMap
        })
      }, 3000)
    }
  }, [state?.resources?.energy, state?.resources?.money, state?.resources?.materials, state?.resources?.reputation, state?.resources?.whitehats, victoryPoints])

  // Animate value counting
  const animateValue = (resource: string, start: number, end: number) => {
    const duration = 500 // 500ms for counting animation
    const steps = Math.abs(end - start)
    const stepTime = duration / Math.max(steps, 1)
    let current = start
    const increment = end > start ? 1 : -1

    const timer = setInterval(() => {
      current += increment
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end
        clearInterval(timer)
      }
      setAnimatedValues((prev) => {
        const newMap = new Map(prev)
        newMap.set(resource, current)
        return newMap
      })
    }, stepTime)
  }

  if (!state || !state.resources) {
    return <div className="flex items-center gap-4">Loading...</div>
  }

  const getResourceChange = (resource: string): ResourceChange | undefined => {
    return resourceChanges.get(resource)
  }

  const getAnimatedValue = (resource: string, actualValue: number | string): number | string => {
    const animated = animatedValues.get(resource)
    if (animated !== undefined) {
      return animated
    }
    return actualValue
  }

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <ResourceItem
        icon={<Zap className="w-6 h-6" />}
        label="Energy"
        value={getAnimatedValue("energy", state.resources.energy)}
        color="text-yellow-500"
        resourceChange={getResourceChange("energy")}
      />
      <ResourceItem
        icon={<Coins className="w-6 h-6" />}
        label="Money"
        value={getAnimatedValue("money", state.resources.money)}
        color="text-green-500"
        resourceChange={getResourceChange("money")}
      />
      <ResourceItem
        icon={<Hammer className="w-6 h-6" />}
        label="Materials"
        value={getAnimatedValue("materials", state.resources.materials)}
        color="text-blue-500"
        resourceChange={getResourceChange("materials")}
      />
      <ResourceItem
        icon={<Users className="w-6 h-6" />}
        label="Reputation"
        value={getAnimatedValue("reputation", state.resources.reputation)}
        color="text-purple-500"
        resourceChange={getResourceChange("reputation")}
      />
      <ResourceItem
        icon={<GraduationCap className="w-6 h-6" />}
        label="Whitehats"
        value={getAnimatedValue("whitehats", state.resources.whitehats)}
        color="text-white"
        resourceChange={getResourceChange("whitehats")}
      />
      <div className="h-6 w-px bg-border" />
      <ResourceItem
        icon={<Trophy className="w-6 h-6" />}
        label="Victory Points"
        value={(() => {
          const animated = animatedValues.get("vpFlat")
          if (animated !== undefined) {
            return `${animated}/100`
          }
          return `${victoryPoints}/100`
        })()}
        color="text-orange-500"
        isVP={true}
        resourceChange={getResourceChange("vpFlat")}
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
  resourceChange,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  isVP?: boolean
  resourceChange?: ResourceChange
}) {
  const hasChange = resourceChange !== undefined
  const isPositive = resourceChange ? resourceChange.change > 0 : false
  const showArrow = hasChange && Date.now() - resourceChange.timestamp < 3000
  const showChangeAmount = hasChange && Date.now() - resourceChange.timestamp < 3000

  return (
    <div className="flex flex-col items-center gap-1 relative">
      <div className="flex items-center gap-2">
        <div 
          className={color}
          style={hasChange ? {
            animation: "blink 0.4s ease-in-out 3"
          } : {}}
        >
          {icon}
        </div>
        <span 
          className={`text-2xl font-bold ${color}`}
          style={{ 
            fontSize: '24px', 
            fontWeight: 700,
            ...(hasChange ? { animation: "blink 0.4s ease-in-out 3" } : {})
          }}
        >
          {value}
        </span>
        {showArrow && (
          <div 
            className={`ml-1 ${isPositive ? "text-green-500" : "text-red-500"}`}
            style={{ 
              animation: "bounce-arrow 0.8s ease-in-out 3"
            }}
          >
            {isPositive ? (
              <ArrowUp className="w-5 h-5" />
            ) : (
              <ArrowDown className="w-5 h-5" />
            )}
          </div>
        )}
      </div>
      {showChangeAmount && resourceChange && (
        <div 
          className={`absolute top-full mt-1 flex items-center gap-1 text-xs font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}
          style={{
            animation: "fadeInOut 3s ease-in-out forwards",
            whiteSpace: "nowrap"
          }}
        >
          <div className={color} style={{ display: 'flex', alignItems: 'center', width: '12px', height: '12px' }}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-3 h-3" }) : icon}
          </div>
          <span>
            {isPositive ? "+" : ""}{resourceChange.change}
          </span>
        </div>
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}
