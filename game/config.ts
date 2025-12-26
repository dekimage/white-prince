export interface GameConfig {
  features: {
    arrowKeys: boolean; // If false, hide arrow indicators and allow free orthogonal movement
  };
}

export const defaultGameConfig: GameConfig = {
  features: {
    arrowKeys: false, // Default: show arrows and restrict movement by doors
  },
};

// Export a singleton config instance
export const gameConfig: GameConfig = { ...defaultGameConfig };

// Helper function to update config
export function updateGameConfig(updates: Partial<GameConfig>): void {
  Object.assign(gameConfig, updates);
  if (updates.features) {
    Object.assign(gameConfig.features, updates.features);
  }
}
