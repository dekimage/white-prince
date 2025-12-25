"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { hasSavedGame } from "@/game/store/persist"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

export default function HomePage() {
  const [hasSave, setHasSave] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setHasSave(hasSavedGame())
  }, [])

  const handleNewGame = () => {
    router.push("/game?new=true")
  }

  const handleContinue = () => {
    router.push("/game")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Sparkles className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Tile Explorer</CardTitle>
          <CardDescription>
            Explore a grid of mysterious tiles, draft rooms, manage resources, and earn victory points. Can you reach
            100 VP before running out of energy?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {hasSave && (
            <Button className="w-full" size="lg" onClick={handleContinue}>
              Continue Game
            </Button>
          )}
          <Button className="w-full" size="lg" variant={hasSave ? "outline" : "default"} onClick={handleNewGame}>
            New Game
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
