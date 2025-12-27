"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

interface SoundContextType {
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  pauseBackgroundMusic: () => void;
  resumeBackgroundMusic: () => void;
  playSound: (soundName: "fail" | "gain" | "effect" | "draft" | "reroll") => void;
  isMusicEnabled: boolean;
  toggleMusic: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const wasPlayingBeforePauseRef = useRef(false);

  useEffect(() => {
    // Initialize background music
    backgroundMusicRef.current = new Audio("/music/background-music.mp3");
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.5; // Adjust volume as needed
    
    // Preload the audio
    backgroundMusicRef.current.load();

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

  const playBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current && isMusicEnabled) {
      // Try to play, and if it fails due to autoplay policy, log it
      const playPromise = backgroundMusicRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Failed to play background music (may need user interaction):", error);
          // If autoplay is blocked, we'll need user interaction to start music
        });
      }
    }
  }, [isMusicEnabled]);

  const stopBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
      wasPlayingBeforePauseRef.current = false;
    }
  }, []);

  const pauseBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      wasPlayingBeforePauseRef.current = !backgroundMusicRef.current.paused;
      backgroundMusicRef.current.pause();
    }
  }, []);

  const resumeBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current && isMusicEnabled && wasPlayingBeforePauseRef.current) {
      backgroundMusicRef.current.play().catch((error) => {
        console.warn("Failed to resume background music:", error);
      });
    }
  }, [isMusicEnabled]);

  const toggleMusic = useCallback(() => {
    setIsMusicEnabled((prev) => {
      const newValue = !prev;
      // Use setTimeout to avoid state update issues
      setTimeout(() => {
        if (newValue) {
          // Enable music
          if (backgroundMusicRef.current) {
            backgroundMusicRef.current?.play().catch((error) => {
              console.warn("Failed to play background music:", error);
            });
          }
        } else {
          // Disable music
          if (backgroundMusicRef.current) {
            backgroundMusicRef.current.pause();
          }
        }
      }, 0);
      return newValue;
    });
  }, []);

  const playSound = useCallback((soundName: "fail" | "gain" | "effect" | "draft" | "reroll") => {
    // Don't play sounds if music is disabled
    if (!isMusicEnabled) return;
    
    const audio = soundRefs.current[soundName];
    if (audio) {
      // Reset to start and play
      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.warn(`Failed to play sound ${soundName}:`, error);
      });
    }
  }, [isMusicEnabled]);

  return (
    <SoundContext.Provider
      value={{
        playBackgroundMusic,
        stopBackgroundMusic,
        pauseBackgroundMusic,
        resumeBackgroundMusic,
        playSound,
        isMusicEnabled,
        toggleMusic,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSoundContext must be used within SoundProvider");
  }
  return context;
}

