export type Direction = "N" | "E" | "S" | "W";

export interface Doors {
  N: boolean;
  E: boolean;
  S: boolean;
  W: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface ResourceCost {
  money?: number;
  materials?: number;
  reputation?: number;
  energy?: number;
}

export interface TileAction {
  id: string;
  label: string;
  description: string;
  cost?: ResourceCost;
  effect: ResourceCost;
  vpFlat?: number;
  maxUses?: number; // If set, action can be used multiple times (up to maxUses)
}

export interface PassiveAbility {
  id: string;
  label: string;
  description: string;
  triggerColor: "orange" | "green" | "blue" | "purple"; // Color of tile that triggers this passive
  reward: ResourceCost & { vpFlat?: number }; // Reward when triggered (resources and/or VP)
}

export interface Quest {
  id: string;
  label: string;
  description: string;
  triggerType:
    | "spend_money"
    | "spend_reputation"
    | "spend_materials"
    | "spend_energy"; // What action triggers progress
  maxProgress: number; // Target count (e.g., 3, 5)
  reward: ResourceCost & { vpFlat?: number }; // Reward when quest completes
}

export interface VPLogic {
  flat?: number;
  perColorType?: {
    orange?: number;
    green?: number;
    blue?: number;
    purple?: number;
  };
}

export interface TileTemplate {
  id: string;
  name: string;
  description: string;
  color: "starter" | "orange" | "green" | "blue" | "purple";
  type: "starter" | "vp" | "economy" | "build" | "social";
  doors: Doors;
  backgroundImageUrl: string;
  placementCost?: ResourceCost;
  actions?: TileAction[];
  passiveAbilities?: PassiveAbility[]; // Passive abilities that trigger when placing tiles of specific colors
  quest?: Quest; // Quest that tracks progress and gives rewards
  vpLogic?: VPLogic;
}

export interface PlacedTile {
  position: Position;
  template: TileTemplate;
  rotation: number; // 0, 90, 180, 270
  claimedActions: string[]; // IDs of claimed actions (for one-time actions)
  actionUsage?: Record<string, number>; // Track usage count for repeatable actions: actionId -> count
}

export interface GameResources {
  energy: number;
  money: number;
  materials: number;
  reputation: number;
}

export interface GameState {
  grid: (PlacedTile | null)[][];
  playerPosition: Position;
  resources: GameResources;
  isDrafting: boolean;
  draftOptions: TileTemplate[];
  selectedTilePosition: Position | null;
  gameStatus: "playing" | "won" | "lost";
  lossReason?: string;
  repeatableActionUsage?: Record<string, number>; // Track global repeatable action usage: "tileId-actionId" -> count
  passiveVP?: number; // Track VP earned from passive abilities
  questProgress?: Record<string, number>; // Track quest progress: "tileId-questId" -> current progress
  completedQuests?: Record<string, boolean>; // Track completed quests: "tileId-questId" -> true
  focusMode?: "grid" | "details"; // Focus mode: grid or details panel
  focusedActionIndex?: number; // Index of focused action in details panel
}

export const GRID_WIDTH = 5;
export const GRID_HEIGHT = 8;
export const STARTING_ENERGY = 50;
export const WIN_VP_THRESHOLD = 100;
