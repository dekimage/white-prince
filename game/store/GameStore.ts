import { makeAutoObservable, runInAction } from "mobx"
import {
  type GameState,
  type Position,
  type Direction,
  type TileTemplate,
  type PlacedTile,
  GRID_WIDTH,
  GRID_HEIGHT,
  STARTING_ENERGY,
  WIN_VP_THRESHOLD,
  type ResourceCost,
} from "../types/game"
import { STARTER_TILE } from "../data/tiles"
import { getAdjacentPosition, getDirectionBetween, isAdjacent } from "../engine/movement"
import { calculateRotation, getDoorAfterRotation } from "../engine/rotation"
import { calculateVictoryPoints } from "../engine/scoring"
import { getRandomTiles } from "../engine/drafting"
import { saveGameState, loadGameState, clearGameState } from "./persist"

class GameStore {
  state: GameState

  constructor() {
    makeAutoObservable(this)

    console.log("[v0] GameStore constructor called")

    // Initialize empty grid
    const emptyGrid: (PlacedTile | null)[][] = Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(null))

    // Starting position
    const startPos: Position = { x: 2, y: 7 }

    // Place starter tile
    emptyGrid[startPos.y][startPos.x] = {
      position: startPos,
      template: STARTER_TILE,
      rotation: 0,
      claimedActions: [],
    }

    this.state = {
      grid: emptyGrid,
      playerPosition: startPos,
      resources: {
        energy: STARTING_ENERGY,
        money: 0,
        materials: 0,
        reputation: 0,
      },
      isDrafting: false,
      draftOptions: [],
      selectedTilePosition: startPos,
      gameStatus: "playing",
    }

    console.log("[v0] GameStore initialized with state:", this.state)
  }

  // Computed values
  get currentTile(): PlacedTile | null {
    if (!this.state || !this.state.grid || !this.state.playerPosition) return null
    const pos = this.state.playerPosition
    if (!this.state.grid[pos.y]) return null
    return this.state.grid[pos.y][pos.x]
  }

  get selectedTile(): PlacedTile | null {
    if (!this.state || !this.state.selectedTilePosition || !this.state.grid) return null
    const pos = this.state.selectedTilePosition
    if (!this.state.grid[pos.y]) return null
    return this.state.grid[pos.y][pos.x]
  }

  get victoryPoints(): number {
    if (!this.state || !this.state.grid || !this.state.resources) return 0
    return calculateVictoryPoints(this.state.grid, this.state.resources)
  }

  get tilesPlaced(): number {
    if (!this.state || !this.state.grid) return 0
    return this.state.grid.flat().filter((t) => t !== null).length
  }

  // Actions
  selectTile(position: Position) {
    if (!this.state || !this.state.grid) return
    if (!this.state.grid[position.y]) return
    if (this.state.gameStatus !== "playing") return
    if (this.state.isDrafting) return // Don't allow selection while drafting

    const tile = this.state.grid[position.y][position.x]
    const currentTile = this.currentTile

    // If clicking on an empty adjacent cell that's reachable, trigger draft
    if (!tile && currentTile && isAdjacent(this.state.playerPosition, position)) {
      const direction = getDirectionBetween(this.state.playerPosition, position)
      if (direction) {
        // Check if current tile has exit door in that direction
        const hasExitDoor = getDoorAfterRotation(currentTile.template.doors, currentTile.rotation, direction)
        if (hasExitDoor) {
          // Start drafting for this empty adjacent cell
          this.startDraft(direction, position)
          return
        }
      }
    }

    // If clicking on an existing tile, select it for viewing
    if (tile) {
      this.state.selectedTilePosition = position
    }
  }

  attemptMove(direction: Direction) {
    if (!this.state || !this.state.grid) return
    if (this.state.gameStatus !== "playing") return

    const targetPos = getAdjacentPosition(this.state.playerPosition, direction)
    if (!targetPos) return // Out of bounds

    if (!this.state.grid[targetPos.y]) return
    const targetTile = this.state.grid[targetPos.y][targetPos.x]

    if (targetTile) {
      // Check if current tile has door in that direction
      const currentTile = this.currentTile!
      const hasExitDoor = getDoorAfterRotation(currentTile.template.doors, currentTile.rotation, direction)

      if (!hasExitDoor) {
        console.log("[v0] No exit door in that direction")
        return
      }

      // Check if target tile has entrance door
      const oppositeDir = this.getOppositeDir(direction)
      const hasEntranceDoor = getDoorAfterRotation(targetTile.template.doors, targetTile.rotation, oppositeDir)

      if (!hasEntranceDoor) {
        console.log("[v0] Target tile has no entrance door")
        return
      }

      // Move to existing tile
      this.movePlayer(targetPos)
    } else {
      // Check if current tile has exit door
      const currentTile = this.currentTile!
      const hasExitDoor = getDoorAfterRotation(currentTile.template.doors, currentTile.rotation, direction)

      if (!hasExitDoor) {
        console.log("[v0] No exit door in that direction")
        return
      }

      // Blank cell - start drafting
      this.startDraft(direction, targetPos)
    }
  }

  private getOppositeDir(dir: Direction): Direction {
    const map: Record<Direction, Direction> = { N: "S", S: "N", E: "W", W: "E" }
    return map[dir]
  }

  private startDraft(direction: Direction, targetPos: Position) {
    if (!this.state) return
    const options = getRandomTiles(3)
    runInAction(() => {
      this.state.isDrafting = true
      this.state.draftOptions = options
      this.state["_draftDirection"] = direction
      this.state["_draftTargetPos"] = targetPos
    })
  }

  selectDraftTile(template: TileTemplate) {
    if (!this.state || !this.state.grid) return
    if (!this.state.isDrafting) return

    const direction = this.state["_draftDirection"] as Direction
    const targetPos = this.state["_draftTargetPos"] as Position

    // Calculate rotation
    const entryDir = this.getOppositeDir(direction)
    const rotation = calculateRotation(entryDir)

    // Place tile
    const newTile: PlacedTile = {
      position: targetPos,
      template,
      rotation,
      claimedActions: [],
    }

    runInAction(() => {
      if (!this.state || !this.state.grid || !this.state.grid[targetPos.y]) return
      this.state.grid[targetPos.y][targetPos.x] = newTile
      this.state.isDrafting = false
      this.state.draftOptions = []
      delete this.state["_draftDirection"]
      delete this.state["_draftTargetPos"]

      // Move player
      this.movePlayer(targetPos)
    })
  }

  private movePlayer(pos: Position) {
    if (!this.state || !this.state.resources) return
    // Spend energy
    this.state.resources.energy -= 1

    // Move player
    this.state.playerPosition = pos
    this.state.selectedTilePosition = pos

    // Check loss conditions
    this.checkGameOver()

    // Save state
    this.save()
  }

  moveToTile(targetPosition: Position): boolean {
    if (!this.state || !this.state.grid) return false
    if (this.state.gameStatus !== "playing") return false
    if (this.state.isDrafting) return false

    const currentTile = this.currentTile
    if (!currentTile) return false

    // Check if target position is adjacent
    if (!isAdjacent(this.state.playerPosition, targetPosition)) {
      return false
    }

    // Check if target tile exists
    if (!this.state.grid[targetPosition.y] || !this.state.grid[targetPosition.y][targetPosition.x]) {
      return false
    }

    const targetTile = this.state.grid[targetPosition.y][targetPosition.x]
    if (!targetTile) return false

    // Get direction from current to target
    const direction = getDirectionBetween(this.state.playerPosition, targetPosition)
    if (!direction) return false

    // Check if current tile has exit door in that direction
    const hasExitDoor = getDoorAfterRotation(currentTile.template.doors, currentTile.rotation, direction)
    if (!hasExitDoor) return false

    // Check if target tile has entrance door
    const oppositeDir = this.getOppositeDir(direction)
    const hasEntranceDoor = getDoorAfterRotation(targetTile.template.doors, targetTile.rotation, oppositeDir)
    if (!hasEntranceDoor) return false

    // Check if we have enough energy
    if (this.state.resources.energy < 1) return false

    // Move player
    this.movePlayer(targetPosition)
    return true
  }

  claimAction(actionId: string) {
    if (!this.state) return
    const currentTile = this.currentTile
    if (!currentTile) return

    const action = currentTile.template.actions?.find((a) => a.id === actionId)
    if (!action) return

    // Check if already claimed
    if (currentTile.claimedActions.includes(actionId)) return

    // Check costs
    if (action.cost) {
      if (!this.canAfford(action.cost)) return
      this.spendResources(action.cost)
    }

    // Apply effects
    if (action.effect) {
      this.gainResources(action.effect)
    }

    // Mark as claimed
    currentTile.claimedActions.push(actionId)

    // Check game over
    this.checkGameOver()

    // Save
    this.save()
  }

  private canAfford(cost: ResourceCost): boolean {
    if (!this.state || !this.state.resources) return false
    if (cost.energy && this.state.resources.energy < cost.energy) return false
    if (cost.money && this.state.resources.money < cost.money) return false
    if (cost.materials && this.state.resources.materials < cost.materials) return false
    if (cost.reputation && this.state.resources.reputation < cost.reputation) return false
    return true
  }

  private spendResources(cost: ResourceCost) {
    if (!this.state || !this.state.resources) return
    if (cost.energy) this.state.resources.energy -= cost.energy
    if (cost.money) this.state.resources.money -= cost.money
    if (cost.materials) this.state.resources.materials -= cost.materials
    if (cost.reputation) this.state.resources.reputation -= cost.reputation
  }

  private gainResources(effect: ResourceCost) {
    if (!this.state || !this.state.resources) return
    if (effect.energy) this.state.resources.energy += effect.energy
    if (effect.money) this.state.resources.money += effect.money
    if (effect.materials) this.state.resources.materials += effect.materials
    if (effect.reputation) this.state.resources.reputation += effect.reputation
  }

  private checkGameOver() {
    if (!this.state) return
    // Check win
    if (this.victoryPoints >= WIN_VP_THRESHOLD) {
      this.state.gameStatus = "won"
      return
    }

    // Check loss - energy
    if (this.state.resources.energy <= 0) {
      this.state.gameStatus = "lost"
      this.state.lossReason = "Out of energy"
      return
    }

    // Check loss - full board
    if (this.tilesPlaced >= GRID_WIDTH * GRID_HEIGHT) {
      if (this.victoryPoints < WIN_VP_THRESHOLD) {
        this.state.gameStatus = "lost"
        this.state.lossReason = "Board full, not enough VP"
      }
    }
  }

  resetGame() {
    console.log("[v0] resetGame called")
    clearGameState()
    // Re-initialize
    const emptyGrid: (PlacedTile | null)[][] = Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(null))

    const startPos: Position = { x: 2, y: 7 }

    emptyGrid[startPos.y][startPos.x] = {
      position: startPos,
      template: STARTER_TILE,
      rotation: 0,
      claimedActions: [],
    }

    runInAction(() => {
      this.state = {
        grid: emptyGrid,
        playerPosition: startPos,
        resources: {
          energy: STARTING_ENERGY,
          money: 0,
          materials: 0,
          reputation: 0,
        },
        isDrafting: false,
        draftOptions: [],
        selectedTilePosition: startPos,
        gameStatus: "playing",
      }
    })

    console.log("[v0] Game reset complete, new state:", this.state)
  }

  save() {
    if (!this.state) return
    saveGameState(this.state)
  }

  load() {
    console.log("[v0] load called")
    const loaded = loadGameState()
    if (loaded) {
      console.log("[v0] Loaded state from localStorage:", loaded)
      runInAction(() => {
        this.state = loaded
      })
      return true
    }
    console.log("[v0] No saved state found")
    return false
  }
}

export const gameStore = new GameStore()
