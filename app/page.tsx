"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasSavedGame } from "@/game/store/persist";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { HowToPlayModal } from "@/components/HowToPlayModal";

export default function HomePage() {
  const [hasSave, setHasSave] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHasSave(hasSavedGame());
  }, []);

  const handleNewGame = () => {
    router.push("/game?new=true");
  };

  const handleContinue = () => {
    router.push("/game");
  };

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20 relative"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-background/80" />
        <Card className="max-w-md w-full relative z-10">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl">WHITE PRINCE</CardTitle>
            <CardDescription className="text-base">
              As a coordinator and overseer of neighbourhood whitehats, you are
              tasked to help generate 100 neighbourhood satisfaction points
              (Victory Points) by managing various locations in your community.
              Do good deeds, build establishments, manage the economy, and more.
              You have limited workers (whitehats), limited energy, and limited
              land to work with. Can you bring the community to a harmonious and
              positive state before you run out of resources?
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {hasSave && (
              <Button className="w-full" size="lg" onClick={handleContinue}>
                Continue Game
              </Button>
            )}
            <Button
              className="w-full"
              size="lg"
              variant={hasSave ? "outline" : "default"}
              onClick={handleNewGame}
            >
              New Game
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={() => setShowHowToPlay(true)}
            >
              How to Play
            </Button>
          </CardContent>
        </Card>
      </div>
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </>
  );
}
