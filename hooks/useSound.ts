"use client";

import { useEffect, useRef } from "react";

interface SoundManager {
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  playSound: (soundName: "fail" | "gain" | "effect" | "draft" | "reroll") => void;
}

export function useSound(): SoundManager {
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Initialize background music
    backgroundMusicRef.current = new Audio("/music/background-music.mp3");
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.5; // Adjust volume as needed

    // Initialize sound effects
    const soundNames: Array<"fail" | "gain" | "effect" | "draft" | "reroll"> = [
      "fail",
      "gain",
      "effect",
      "draft",
      "reroll",
    ];

    soundNames.forEach((soundName) => {
      const audio = new Audio(`/music/${soundName}.mp3`);
      audio.volume = 0.7; // Adjust volume as needed
      soundRefs.current[soundName] = audio;
    });

    // Cleanup on unmount
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
      Object.values(soundRefs.current).forEach((audio) => {
        audio.pause();
      });
      soundRefs.current = {};
    };
  }, []);

  const playBackgroundMusic = () => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.play().catch((error) => {
        console.warn("Failed to play background music:", error);
      });
    }
  };

  const stopBackgroundMusic = () => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  };

  const playSound = (soundName: "fail" | "gain" | "effect" | "draft" | "reroll") => {
    const audio = soundRefs.current[soundName];
    if (audio) {
      // Reset to start and play
      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.warn(`Failed to play sound ${soundName}:`, error);
      });
    }
  };

  return {
    playBackgroundMusic,
    stopBackgroundMusic,
    playSound,
  };
}

