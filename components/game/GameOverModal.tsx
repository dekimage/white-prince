"use client"

import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export const GameOverModal = observer(() => {
  const { state, victoryPoints, tilesPlaced } = gameStore
  const router = useRouter()

  if (!state) return null

  const isOpen = state.gameStatus === "won" || state.gameStatus === "lost"
  const isWin = state.gameStatus === "won"

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            {isWin ? (
              <Trophy className="w-16 h-16 text-orange-500" />
            ) : (
              <XCircle className="w-16 h-16 text-destructive" />
            )}
          </div>
          <DialogTitle className="text-center text-2xl">{isWin ? "Victory!" : "Game Over"}</DialogTitle>
          <DialogDescription className="text-center">
            {isWin
              ? `Congratulations! You achieved ${victoryPoints} Victory Points!`
              : state.lossReason || "Better luck next time!"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Victory Points:</span>
            <span className="font-medium">{victoryPoints}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tiles Placed:</span>
            <span className="font-medium">{tilesPlaced}/25</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Energy Remaining:</span>
            <span className="font-medium">{state.resources.energy}</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/")}>
            Home
          </Button>
          <Button onClick={() => gameStore.resetGame()}>Play Again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

GameOverModal.displayName = "GameOverModal"
