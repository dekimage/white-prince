"use client"

import { observer } from "mobx-react-lite"
import { gameStore } from "@/game/store/GameStore"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const DraftModal = observer(() => {
  const { state } = gameStore

  if (!state) return null

  const colorClasses: Record<string, string> = {
    starter: "bg-gray-600",
    orange: "bg-orange-600",
    green: "bg-green-600",
    blue: "bg-blue-600",
    purple: "bg-purple-600",
  }

  return (
    <Dialog open={state.isDrafting}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose a Tile</DialogTitle>
          <DialogDescription>Select one tile to place and enter. This cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          {state.draftOptions.map((tile, index) => (
            <Card
              key={`${tile.id}-${index}`}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => gameStore.selectDraftTile(tile)}
            >
              <div className="relative w-full aspect-square rounded-t-lg overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${tile.backgroundImageUrl})` }}
                />
                <div className={`absolute inset-0 ${colorClasses[tile.color]} opacity-50`} />
              </div>
              <CardHeader>
                <CardTitle className="text-base">{tile.name}</CardTitle>
                <CardDescription className="text-xs">{tile.description}</CardDescription>
              </CardHeader>
              <div className="px-4 pb-4">
                <Button className="w-full" size="sm">
                  Select
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
})

DraftModal.displayName = "DraftModal"
