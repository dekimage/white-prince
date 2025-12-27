"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useSearchParams, useRouter } from "next/navigation";
import { gameStore } from "@/game/store/GameStore";
import { GameGrid } from "@/components/game/GameGrid";
import { TileDetailsPanel } from "@/components/game/TileDetailsPanel";
import { MessageLog } from "@/components/game/MessageLog";
import { ResourceBar } from "@/components/game/ResourceBar";
import { DraftModal } from "@/components/game/DraftModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { KeyboardControls } from "@/components/game/KeyboardControls";
import { ViewAllTilesModal } from "@/components/game/ViewAllTilesModal";
import { SoundEffects } from "@/components/game/SoundEffects";
import { Button } from "@/components/ui/button";
import { Settings, Moon, Sun, Music, VolumeX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { SoundProvider, useSoundContext } from "@/contexts/SoundContext";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNewGame = searchParams.get("new") === "true";
  const [isInitialized, setIsInitialized] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showAllTiles, setShowAllTiles] = useState(false);
  const { playBackgroundMusic, isMusicEnabled, toggleMusic } =
    useSoundContext();

  // Handle user interaction to start music (browser autoplay policy workaround)
  const hasUserInteractedRef = React.useRef(false);
  const handleUserInteraction = useCallback(() => {
    if (!hasUserInteractedRef.current && isInitialized && isMusicEnabled) {
      hasUserInteractedRef.current = true;
      playBackgroundMusic();
    }
  }, [isInitialized, isMusicEnabled, playBackgroundMusic]);

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log("[v0] GamePageContent rendered, isNewGame:", isNewGame);

  useEffect(() => {
    console.log("[v0] useEffect triggered, isNewGame:", isNewGame);
    if (isNewGame) {
      gameStore.resetGame();
    } else {
      const loaded = gameStore.load();
      if (!loaded) {
        gameStore.resetGame();
      }
    }
    setIsInitialized(true);
  }, [isNewGame]);

  // Try to start music when game initializes (may fail due to autoplay policy, will start on user interaction)
  useEffect(() => {
    if (isInitialized && isMusicEnabled) {
      // Small delay to ensure audio is ready
      const timer = setTimeout(() => {
        playBackgroundMusic();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, isMusicEnabled, playBackgroundMusic]);

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset the game? All progress will be lost."
      )
    ) {
      gameStore.resetGame();
    }
  };

  const handleHome = () => {
    router.push("/");
  };

  console.log("[v0] Current game state:", gameStore.state);

  if (!isInitialized || !gameStore.state) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col bg-background"
      onClick={handleUserInteraction}
      onKeyDown={handleUserInteraction}
    >
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1" /> {/* Spacer for left */}
          <ResourceBar />
          <div className="flex-1 flex items-center justify-end gap-2">
            {/* Music toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMusic}
                aria-label={isMusicEnabled ? "Disable music" : "Enable music"}
              >
                {isMusicEnabled ? (
                  <Music className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </Button>
            )}
            {/* Dark mode toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowAllTiles(true)}>
                  View All Tiles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReset}>
                  Reset Game
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleHome}>Home</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message log */}
        <div className="w-80 border-r bg-card overflow-hidden">
          <MessageLog />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          <GameGrid />
        </div>

        {/* Tile details panel */}
        <div className="w-80 border-l bg-card overflow-auto">
          <TileDetailsPanel />
        </div>
      </div>

      {/* Modals */}
      <DraftModal />
      <GameOverModal />
      <ViewAllTilesModal
        isOpen={showAllTiles}
        onClose={() => setShowAllTiles(false)}
      />
      <KeyboardControls />
      <SoundEffects />

      {/* Controls hint */}
      <div className="border-t bg-card px-4 py-2 text-center text-xs text-muted-foreground">
        Use WASD or Arrow Keys to move • Click tiles to inspect • Click arrows
        to move
      </div>
    </div>
  );
}

export default observer(function GamePage() {
  console.log("[v0] GamePage observer component rendered");
  return (
    <SoundProvider>
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <GamePageContent />
      </Suspense>
    </SoundProvider>
  );
});
