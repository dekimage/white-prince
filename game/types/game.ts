export type Direction = "N" | "E" | "S" | "W"

export interface Doors {
  N: boolean
  E: boolean
  S: boolean
  W: boolean
}

export interface Position {
  x: number
  y: number
}

export interface ResourceCost {
  money?: number
  materials?: number
  reputation?: number
  energy?: number
}

export interface TileAction {
  id: string
  label: string
  description: string
  cost?: ResourceCost
  effect: ResourceCost
  vpFlat?: number
}

export interface VPLogic {
  flat?: number
  perColorType?: {
    orange?: number
    green?: number
    blue?: number
    purple?: number
  }
}

export interface TileTemplate {
  id: string
  name: string
  description: string
  color: "starter" | "orange" | "green" | "blue" | "purple"
  type: "starter" | "vp" | "economy" | "build" | "social"
  doors: Doors
  backgroundImageUrl: string
  placementCost?: ResourceCost
  actions?: TileAction[]
  vpLogic?: VPLogic
}

export interface PlacedTile {
  position: Position
  template: TileTemplate
  rotation: number // 0, 90, 180, 270
  claimedActions: string[] // IDs of claimed actions
}

export interface GameResources {
  energy: number
  money: number
  materials: number
  reputation: number
}

export interface GameState {
  grid: (PlacedTile | null)[][]
  playerPosition: Position
  resources: GameResources
  isDrafting: boolean
  draftOptions: TileTemplate[]
  selectedTilePosition: Position | null
  gameStatus: "playing" | "won" | "lost"
  lossReason?: string
}

export const GRID_WIDTH = 5
export const GRID_HEIGHT = 8
export const STARTING_ENERGY = 50
export const WIN_VP_THRESHOLD = 100
