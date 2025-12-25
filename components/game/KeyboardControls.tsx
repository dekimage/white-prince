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
