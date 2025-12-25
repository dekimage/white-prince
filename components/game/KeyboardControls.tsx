"use client"

import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import type { Direction } from "@/game/types/game"

export const KeyboardControls = observer(() => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStore.state) return
      if (gameStore.state.gameStatus !== "playing") return
      if (gameStore.state.isDrafting) return

      const focusMode = gameStore.state.focusMode || "grid"

      // Handle ESC to go back to grid
      if (e.key === "Escape") {
        if (focusMode === "details") {
          e.preventDefault()
          gameStore.setFocusMode("grid")
          return
        }
      }

      // Details panel navigation - only intercept Up/Down arrows and Enter/Space
      if (focusMode === "details") {
        if (e.key.toLowerCase() === "arrowup") {
          e.preventDefault()
          gameStore.setFocusedActionIndex((gameStore.state.focusedActionIndex || 0) - 1)
          return
        }
        if (e.key.toLowerCase() === "arrowdown") {
          e.preventDefault()
          gameStore.setFocusedActionIndex((gameStore.state.focusedActionIndex || 0) + 1)
          return
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          gameStore.useFocusedAction()
          return
        }
        // In details mode, ignore other keys (don't handle movement)
        return
      }

      // Grid navigation (default mode) - handle movement
      // Enter/Space to focus details (only if on current tile with actions)
      if (e.key === "Enter" || e.key === " ") {
        const currentTile = gameStore.currentTile
        const selectedTile = gameStore.selectedTile
        // Only focus details if selected tile is current tile and has actions
        if (
          currentTile &&
          selectedTile &&
          currentTile.position.x === selectedTile.position.x &&
          currentTile.position.y === selectedTile.position.y &&
          currentTile.template.actions &&
          currentTile.template.actions.length > 0
        ) {
          e.preventDefault()
          gameStore.setFocusMode("details")
          return
        }
      }

      // Movement - always available when not in details mode
      let direction: Direction | null = null

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          direction = "N"
          break
        case "s":
        case "arrowdown":
          direction = "S"
          break
        case "d":
        case "arrowright":
          direction = "E"
          break
        case "a":
        case "arrowleft":
          direction = "W"
          break
      }

      if (direction) {
        e.preventDefault()
        gameStore.attemptMove(direction)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return null
})

KeyboardControls.displayName = "KeyboardControls"
