"use client";

import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { reaction } from "mobx";
import { gameStore } from "@/game/store/GameStore";
import { useSoundContext } from "@/contexts/SoundContext";

export const SoundEffects = observer(() => {
  const { playSound } = useSoundContext();
  const prevGameStatusRef = useRef<string>("playing");
  const lastMessageIdRef = useRef<string>("");

  // Background music continues playing during drafting - no pause/resume needed

  // Watch for game over (fail sound)
  useEffect(() => {
    const dispose = reaction(
      () => gameStore.state?.gameStatus,
      (gameStatus) => {
        if (gameStatus === "lost" && prevGameStatusRef.current !== "lost") {
          playSound("fail");
        }
        if (gameStatus) {
          prevGameStatusRef.current = gameStatus;
        }
      }
    );
    return dispose;
  }, [playSound]);

  // Watch for quest completion and passive ability triggers (gain sound)
  useEffect(() => {
    const dispose = reaction(
      () => gameStore.state?.messageLog,
      (messageLog) => {
        if (!messageLog || messageLog.length === 0) return;
        const lastMessage = messageLog[messageLog.length - 1];
        if (lastMessage.id === lastMessageIdRef.current) return; // Already processed

        lastMessageIdRef.current = lastMessage.id;

        // Check if message is about quest completion or passive ability
        if (
          lastMessage.message.includes("Quest completed") ||
          lastMessage.message.includes("effect triggered!")
        ) {
          playSound("gain");
        }
      }
    );
    return dispose;
  }, [playSound]);

  // Watch for action usage (effect sound)
  useEffect(() => {
    const dispose = reaction(
      () => {
        const state = gameStore.state;
        if (!state) return null;
        // Track when actions are used by watching message log for "You used"
        const messageLog = state.messageLog;
        if (!messageLog || messageLog.length === 0) return null;
        const lastMessage = messageLog[messageLog.length - 1];
        return lastMessage.message.startsWith("You used") ? lastMessage.id : null;
      },
      (actionMessageId) => {
        if (actionMessageId) {
          playSound("effect");
        }
      }
    );
    return dispose;
  }, [playSound]);

  return null; // This component doesn't render anything
});

SoundEffects.displayName = "SoundEffects";

