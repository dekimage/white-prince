import { makeAutoObservable, runInAction } from "mobx";
import {
  type GameState,
  type Position,
  type Direction,
  type TileTemplate,
  type PlacedTile,
  GRID_WIDTH,
  GRID_HEIGHT,
  STARTING_ENERGY,
  STARTING_WHITEHATS,
  WIN_VP_THRESHOLD,
  type ResourceCost,
  type GameLogMessage,
} from "../types/game";
import { STARTER_TILE } from "../data/tiles";
import {
  getAdjacentPosition,
  getDirectionBetween,
  isAdjacent,
} from "../engine/movement";
import { calculateRotation, getDoorAfterRotation } from "../engine/rotation";
import { gameConfig } from "../config";
import { calculateVictoryPoints } from "../engine/scoring";
import { getRandomTiles } from "../engine/drafting";
import { saveGameState, loadGameState, clearGameState } from "./persist";

class GameStore {
  state: GameState;

  constructor() {
    makeAutoObservable(this);

    console.log("[v0] GameStore constructor called");

    // Initialize empty grid
    const emptyGrid: (PlacedTile | null)[][] = Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(null));

    // Starting position (center of 5x5 grid)
    const startPos: Position = { x: 3, y: 3 };

    // Place starter tile
    emptyGrid[startPos.y][startPos.x] = {
      position: startPos,
      template: STARTER_TILE,
      rotation: 0,
      claimedActions: [],
      actionUsage: {},
    };

    this.state = {
      grid: emptyGrid,
      playerPosition: startPos,
      resources: {
        energy: STARTING_ENERGY,
        money: 10,
        materials: 5,
        reputation: 3,
        whitehats: STARTING_WHITEHATS,
      },
      isDrafting: false,
      draftOptions: [],
      selectedTilePosition: startPos,
      gameStatus: "playing",
      repeatableActionUsage: {},
      passiveVP: 0,
      questProgress: {},
      completedQuests: {},
      messageLog: [],
      focusMode: "grid",
      focusedActionIndex: 0,
    };

    console.log("[v0] GameStore initialized with state:", this.state);
    // Add initial log message
    this.addLogMessage("Game started! Welcome to the neighbourhood.");
  }

  // Computed values
  get currentTile(): PlacedTile | null {
    if (!this.state || !this.state.grid || !this.state.playerPosition)
      return null;
    const pos = this.state.playerPosition;
    if (!this.state.grid[pos.y]) return null;
    return this.state.grid[pos.y][pos.x];
  }

  get selectedTile(): PlacedTile | null {
    if (!this.state || !this.state.selectedTilePosition || !this.state.grid)
      return null;
    const pos = this.state.selectedTilePosition;
    if (!this.state.grid[pos.y]) return null;
    return this.state.grid[pos.y][pos.x];
  }

  get victoryPoints(): number {
    if (!this.state || !this.state.grid || !this.state.resources) return 0;
    const baseVP = calculateVictoryPoints(
      this.state.grid,
      this.state.resources
    );
    const passiveVP = this.state.passiveVP || 0;
    return baseVP + passiveVP;
  }

  get tilesPlaced(): number {
    if (!this.state || !this.state.grid) return 0;
    return this.state.grid.flat().filter((t) => t !== null).length;
  }

  // Actions
  selectTile(position: Position) {
    if (!this.state || !this.state.grid) return;
    if (!this.state.grid[position.y]) return;
    if (this.state.gameStatus !== "playing") return;
    if (this.state.isDrafting) return; // Don't allow selection while drafting

    const tile = this.state.grid[position.y][position.x];
    const currentTile = this.currentTile;

    // If clicking on an empty adjacent cell that's reachable, trigger draft
    if (
      !tile &&
      currentTile &&
      isAdjacent(this.state.playerPosition, position)
    ) {
      const direction = getDirectionBetween(
        this.state.playerPosition,
        position
      );
      if (direction) {
        // Check if current tile has exit door in that direction
        const hasExitDoor = getDoorAfterRotation(
          currentTile.template.doors,
          currentTile.rotation,
          direction
        );
        if (hasExitDoor) {
          // Start drafting for this empty adjacent cell
          this.startDraft(direction, position);
          return;
        }
      }
    }

    // If clicking on an existing tile, select it for viewing
    if (tile) {
      this.state.selectedTilePosition = position;
    }
  }

  attemptMove(direction: Direction) {
    if (!this.state || !this.state.grid) return;
    if (this.state.gameStatus !== "playing") return;

    const targetPos = getAdjacentPosition(this.state.playerPosition, direction);
    if (!targetPos) return; // Out of bounds

    if (!this.state.grid[targetPos.y]) return;
    const targetTile = this.state.grid[targetPos.y][targetPos.x];

    if (targetTile) {
      // If arrowKeys feature is enabled, check doors. Otherwise, allow free movement
      if (gameConfig.features.arrowKeys) {
        // Check if current tile has door in that direction
        const currentTile = this.currentTile!;
        const hasExitDoor = getDoorAfterRotation(
          currentTile.template.doors,
          currentTile.rotation,
          direction
        );

        if (!hasExitDoor) {
          console.log("[v0] No exit door in that direction");
          return;
        }

        // Check if target tile has entrance door
        const oppositeDir = this.getOppositeDir(direction);
        const hasEntranceDoor = getDoorAfterRotation(
          targetTile.template.doors,
          targetTile.rotation,
          oppositeDir
        );

        if (!hasEntranceDoor) {
          console.log("[v0] Target tile has no entrance door");
          return;
        }
      }

      // Move to existing tile
      this.movePlayer(targetPos);
    } else {
      // If arrowKeys feature is enabled, check doors. Otherwise, allow free movement
      if (gameConfig.features.arrowKeys) {
        // Check if current tile has exit door
        const currentTile = this.currentTile!;
        const hasExitDoor = getDoorAfterRotation(
          currentTile.template.doors,
          currentTile.rotation,
          direction
        );

        if (!hasExitDoor) {
          console.log("[v0] No exit door in that direction");
          return;
        }
      }

      // Blank cell - start drafting
      this.startDraft(direction, targetPos);
    }
  }

  private getOppositeDir(dir: Direction): Direction {
    const map: Record<Direction, Direction> = {
      N: "S",
      S: "N",
      E: "W",
      W: "E",
    };
    return map[dir];
  }

  private startDraft(direction: Direction, targetPos: Position) {
    if (!this.state) return;
    const options = getRandomTiles(3);

    // Check if any tile can be drafted
    const canDraftAny = options.some(
      (tile) => this.state.resources.whitehats >= tile.draftingCost
    );

    if (!canDraftAny) {
      // Game over - no tiles can be drafted
      const finalVP = this.victoryPoints;
      runInAction(() => {
        this.state.gameStatus = "lost";
        this.state.lossReason = `Not enough whitehats to draft any available tiles. Final Score: ${finalVP} Victory Points`;
      });
      return;
    }

    runInAction(() => {
      this.state.isDrafting = true;
      this.state.draftOptions = options;
      this.state.draftRerollCount = 0; // Reset reroll count for new draft
      this.state["_draftDirection"] = direction;
      this.state["_draftTargetPos"] = targetPos;
    });
  }

  rerollDraft() {
    if (!this.state || !this.state.isDrafting) return;

    const rerollCount = this.state.draftRerollCount || 0;

    // Check max rerolls (3 times max)
    if (rerollCount >= 3) {
      this.addLogMessage("Maximum rerolls reached (3 per draft)");
      return;
    }

    // Calculate cost (1st = 1, 2nd = 2, 3rd = 3)
    const cost = rerollCount + 1;

    // Check if player can afford
    if (this.state.resources.energy < cost) {
      this.addLogMessage(`Not enough energy to reroll (need ${cost})`);
      return;
    }

    // Get new random tiles
    const newOptions = getRandomTiles(3);

    // Check if any tile can be drafted
    const canDraftAny = newOptions.some(
      (tile) => this.state.resources.whitehats >= tile.draftingCost
    );

    if (!canDraftAny) {
      // Game over - no tiles can be drafted
      const finalVP = this.victoryPoints;
      runInAction(() => {
        this.state.gameStatus = "lost";
        this.state.lossReason = `Not enough whitehats to draft any available tiles. Final Score: ${finalVP} Victory Points`;
      });
      return;
    }

    // Deduct energy and update draft options
    runInAction(() => {
      this.state.resources.energy -= cost;
      this.state.draftOptions = newOptions;
      this.state.draftRerollCount = rerollCount + 1;
    });

    this.addLogMessage(`Rerolled draft options (${cost} Energy)`, {
      energy: -cost,
    });
  }

  selectDraftTile(template: TileTemplate) {
    if (!this.state || !this.state.grid) return;
    if (!this.state.isDrafting) return;

    // Check if we have enough whitehats
    if (this.state.resources.whitehats < template.draftingCost) {
      return;
    }

    const direction = this.state["_draftDirection"] as Direction;
    const targetPos = this.state["_draftTargetPos"] as Position;

    // Calculate rotation
    const entryDir = this.getOppositeDir(direction);
    const rotation = calculateRotation(entryDir);

    // Place tile
    const newTile: PlacedTile = {
      position: targetPos,
      template,
      rotation,
      claimedActions: [],
      actionUsage: {},
    };

    runInAction(() => {
      if (!this.state || !this.state.grid || !this.state.grid[targetPos.y])
        return;

      // Spend whitehats
      this.state.resources.whitehats -= template.draftingCost;

      this.state.grid[targetPos.y][targetPos.x] = newTile;
      this.state.isDrafting = false;
      this.state.draftOptions = [];
      delete this.state["_draftDirection"];
      delete this.state["_draftTargetPos"];

      // Trigger passive abilities from all placed tiles
      this.triggerPassiveAbilities(template.color);

      // Log tile draft
      this.addLogMessage(`You drafted ${template.name}`, {
        whitehats: -template.draftingCost,
      });

      // Move player
      this.movePlayer(targetPos);
    });
  }

  private triggerPassiveAbilities(
    placedColor: "orange" | "green" | "blue" | "purple"
  ) {
    if (!this.state || !this.state.grid) return;

    // Check all placed tiles for passive abilities that match the placed color
    this.state.grid.flat().forEach((tile) => {
      if (!tile || !tile.template.passiveAbilities) return;

      tile.template.passiveAbilities.forEach((passive) => {
        if (passive.triggerColor === placedColor) {
          // Apply reward
          if (passive.reward) {
            this.gainResources(passive.reward);
          }
          // Track VP if any
          if (passive.reward.vpFlat) {
            if (!this.state.passiveVP) {
              this.state.passiveVP = 0;
            }
            this.state.passiveVP += passive.reward.vpFlat;
            console.log(
              `[Passive] ${tile.template.name} triggered: +${passive.reward.vpFlat} VP`
            );
          }

          // Log passive ability trigger
          const colorNames: Record<string, string> = {
            orange: "Orange",
            green: "Green",
            blue: "Blue",
            purple: "Purple",
          };
          this.addLogMessage(
            `${tile.template.name} effect triggered! (placed ${colorNames[placedColor]} tile)`,
            passive.reward
          );
        }
      });
    });
  }

  private movePlayer(pos: Position) {
    if (!this.state || !this.state.resources) return;
    const currentTile = this.currentTile;
    const targetTile = this.state.grid?.[pos.y]?.[pos.x];

    // Spend energy
    this.state.resources.energy -= 1;

    // Move player
    this.state.playerPosition = pos;
    this.state.selectedTilePosition = pos;
    this.state.focusMode = "grid"; // Reset focus to grid after moving

    // Log movement
    if (targetTile) {
      this.addLogMessage(`You moved to ${targetTile.template.name}`, {
        energy: -1,
      });
    } else {
      this.addLogMessage(`You moved to a new location`, { energy: -1 });
    }

    // Check loss conditions
    this.checkGameOver();

    // Save state
    this.save();
  }

  setFocusMode(mode: "grid" | "details") {
    if (!this.state) return;
    this.state.focusMode = mode;
    if (mode === "details") {
      this.state.focusedActionIndex = 0;
    }
  }

  setFocusedActionIndex(index: number) {
    if (!this.state) return;
    const currentTile = this.currentTile;
    if (!currentTile || !currentTile.template.actions) return;
    const maxIndex = currentTile.template.actions.length - 1;
    this.state.focusedActionIndex = Math.max(0, Math.min(maxIndex, index));
  }

  useFocusedAction() {
    if (!this.state) return;
    const currentTile = this.currentTile;
    if (!currentTile || !currentTile.template.actions) return;
    const actionIndex = this.state.focusedActionIndex || 0;
    const action = currentTile.template.actions[actionIndex];
    if (action) {
      this.claimAction(action.id);

      // Check if there are any remaining activatable actions
      const hasRemainingActions = currentTile.template.actions.some((a) => {
        const usage = this.getActionUsage(currentTile, a.id);
        if (usage.isComplete) return false;

        // Check if we can afford it
        if (a.cost && !this.canAfford(a.cost)) return false;

        return true;
      });

      // If no remaining actions, return focus to grid
      if (!hasRemainingActions) {
        this.setFocusMode("grid");
      }
    }
  }

  moveToTile(targetPosition: Position): boolean {
    if (!this.state || !this.state.grid) return false;
    if (this.state.gameStatus !== "playing") return false;
    if (this.state.isDrafting) return false;

    const currentTile = this.currentTile;
    if (!currentTile) return false;

    // Check if target position is adjacent
    if (!isAdjacent(this.state.playerPosition, targetPosition)) {
      return false;
    }

    // Check if target tile exists
    if (
      !this.state.grid[targetPosition.y] ||
      !this.state.grid[targetPosition.y][targetPosition.x]
    ) {
      return false;
    }

    const targetTile = this.state.grid[targetPosition.y][targetPosition.x];
    if (!targetTile) return false;

    // Get direction from current to target
    const direction = getDirectionBetween(
      this.state.playerPosition,
      targetPosition
    );
    if (!direction) return false;

    // If arrowKeys feature is enabled, check doors. Otherwise, allow free movement
    if (gameConfig.features.arrowKeys) {
      // Check if current tile has exit door in that direction
      const hasExitDoor = getDoorAfterRotation(
        currentTile.template.doors,
        currentTile.rotation,
        direction
      );
      if (!hasExitDoor) return false;

      // Check if target tile has entrance door
      const oppositeDir = this.getOppositeDir(direction);
      const hasEntranceDoor = getDoorAfterRotation(
        targetTile.template.doors,
        targetTile.rotation,
        oppositeDir
      );
      if (!hasEntranceDoor) return false;
    }

    // Check if we have enough energy
    if (this.state.resources.energy < 1) return false;

    // Move player
    this.movePlayer(targetPosition);
    return true;
  }

  claimAction(actionId: string) {
    if (!this.state) return;
    const currentTile = this.currentTile;
    if (!currentTile) return;

    const action = currentTile.template.actions?.find((a) => a.id === actionId);
    if (!action) return;

    // Check if repeatable action
    if (action.maxUses) {
      const usageKey = `${currentTile.template.id}-${actionId}`;
      const currentUsage = this.state.repeatableActionUsage?.[usageKey] || 0;

      // Check if max uses reached
      if (currentUsage >= action.maxUses) return;

      // Check costs
      if (action.cost) {
        if (!this.canAfford(action.cost)) return;
        this.spendResources(action.cost);
        // Trigger quest progress for spending resources
        this.triggerQuestProgress(action.cost);
      }

      // Apply effects
      if (action.effect) {
        this.gainResources(action.effect);
      }

      // Increment usage
      if (!this.state.repeatableActionUsage) {
        this.state.repeatableActionUsage = {};
      }
      this.state.repeatableActionUsage[usageKey] = currentUsage + 1;

      // Log action usage
      const resourceChanges: ResourceCost & { vpFlat?: number } = {};
      // Add costs as negative values
      if (action.cost) {
        Object.keys(action.cost).forEach((key) => {
          const costKey = key as keyof ResourceCost;
          if (action.cost![costKey]) {
            resourceChanges[costKey] = -(action.cost![costKey] || 0);
          }
        });
      }
      // Add effects as positive values
      if (action.effect) {
        Object.keys(action.effect).forEach((key) => {
          const effectKey = key as keyof ResourceCost;
          if (action.effect![effectKey]) {
            resourceChanges[effectKey] =
              (resourceChanges[effectKey] || 0) +
              (action.effect![effectKey] || 0);
          }
        });
      }
      // Add VP if any
      if (action.vpFlat) {
        resourceChanges.vpFlat = action.vpFlat;
      }
      this.addLogMessage(`You used ${action.label}`, resourceChanges);
    } else {
      // One-time action
      // Check if already claimed
      if (currentTile.claimedActions.includes(actionId)) return;

      // Check costs
      if (action.cost) {
        if (!this.canAfford(action.cost)) return;
        this.spendResources(action.cost);
        // Trigger quest progress for spending resources
        this.triggerQuestProgress(action.cost);
      }

      // Apply effects
      if (action.effect) {
        this.gainResources(action.effect);
      }

      // Mark as claimed
      currentTile.claimedActions.push(actionId);

      // Log action usage
      const resourceChanges: ResourceCost & { vpFlat?: number } = {};
      // Add costs as negative values
      if (action.cost) {
        Object.keys(action.cost).forEach((key) => {
          const costKey = key as keyof ResourceCost;
          if (action.cost![costKey]) {
            resourceChanges[costKey] = -(action.cost![costKey] || 0);
          }
        });
      }
      // Add effects as positive values
      if (action.effect) {
        Object.keys(action.effect).forEach((key) => {
          const effectKey = key as keyof ResourceCost;
          if (action.effect![effectKey]) {
            resourceChanges[effectKey] =
              (resourceChanges[effectKey] || 0) +
              (action.effect![effectKey] || 0);
          }
        });
      }
      // Add VP if any
      if (action.vpFlat) {
        resourceChanges.vpFlat = action.vpFlat;
      }
      this.addLogMessage(`You used ${action.label}`, resourceChanges);
    }

    // Check game over
    this.checkGameOver();

    // Save
    this.save();
  }

  private triggerQuestProgress(cost: ResourceCost) {
    if (!this.state || !this.state.grid) return;

    // Iterate through all placed tiles to find quest tiles
    this.state.grid.forEach((row) => {
      row.forEach((tile) => {
        if (!tile || !tile.template.quest) return;

        const quest = tile.template.quest;
        const questKey = `${tile.template.id}-${quest.id}`;

        // Skip if quest already completed
        if (this.state.completedQuests?.[questKey]) return;

        // Check if this cost matches the quest trigger
        let shouldProgress = false;
        switch (quest.triggerType) {
          case "spend_money":
            shouldProgress = !!(cost.money && cost.money > 0);
            break;
          case "spend_reputation":
            shouldProgress = !!(cost.reputation && cost.reputation > 0);
            break;
          case "spend_materials":
            shouldProgress = !!(cost.materials && cost.materials > 0);
            break;
          case "spend_energy":
            shouldProgress = !!(cost.energy && cost.energy > 0);
            break;
        }

        if (shouldProgress) {
          // Initialize quest progress if needed
          if (!this.state.questProgress) {
            this.state.questProgress = {};
          }
          const currentProgress = this.state.questProgress[questKey] || 0;
          const newProgress = currentProgress + 1;

          // Update progress
          this.state.questProgress[questKey] = newProgress;

          // Check if quest is complete
          if (newProgress >= quest.maxProgress) {
            this.completeQuest(tile, quest);
          }
        }
      });
    });
  }

  private completeQuest(tile: PlacedTile, quest: Quest) {
    if (!this.state) return;

    const questKey = `${tile.template.id}-${quest.id}`;

    // Mark as completed
    if (!this.state.completedQuests) {
      this.state.completedQuests = {};
    }
    this.state.completedQuests[questKey] = true;

    // Apply reward
    if (quest.reward) {
      this.gainResources(quest.reward);
      if (quest.reward.vpFlat) {
        if (!this.state.passiveVP) {
          this.state.passiveVP = 0;
        }
        this.state.passiveVP += quest.reward.vpFlat;
      }
    }

    // Log quest completion
    this.addLogMessage(
      `Quest completed: ${tile.template.name} - ${quest.label}`,
      quest.reward
    );

    console.log(
      `[Quest] ${tile.template.name} - ${quest.label} completed! Reward applied.`
    );
  }

  getQuestProgress(
    tile: PlacedTile
  ): { current: number; max: number; isComplete: boolean } | null {
    if (!this.state || !tile.template.quest) return null;

    const quest = tile.template.quest;
    const questKey = `${tile.template.id}-${quest.id}`;
    const current = this.state.questProgress?.[questKey] || 0;
    const isComplete = this.state.completedQuests?.[questKey] || false;

    return {
      current,
      max: quest.maxProgress,
      isComplete,
    };
  }

  private addLogMessage(
    message: string,
    resourceChanges?: ResourceCost & { vpFlat?: number }
  ) {
    if (!this.state) return;
    if (!this.state.messageLog) {
      this.state.messageLog = [];
    }
    const logMessage: GameLogMessage = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      message,
      resourceChanges,
    };
    this.state.messageLog.push(logMessage);
    // Keep only last 100 messages to prevent memory issues
    if (this.state.messageLog.length > 100) {
      this.state.messageLog.shift();
    }
  }

  getActionUsage(
    tile: PlacedTile,
    actionId: string
  ): { current: number; max: number; isComplete: boolean } {
    if (!this.state) return { current: 0, max: 1, isComplete: false };

    const action = tile.template.actions?.find((a) => a.id === actionId);
    if (!action) return { current: 0, max: 1, isComplete: false };

    if (action.maxUses) {
      // Repeatable action
      const usageKey = `${tile.template.id}-${actionId}`;
      const currentUsage = this.state.repeatableActionUsage?.[usageKey] || 0;
      return {
        current: currentUsage,
        max: action.maxUses,
        isComplete: currentUsage >= action.maxUses,
      };
    } else {
      // One-time action
      const isClaimed = tile.claimedActions.includes(actionId);
      return {
        current: isClaimed ? 1 : 0,
        max: 1,
        isComplete: isClaimed,
      };
    }
  }

  isTileComplete(tile: PlacedTile): boolean {
    if (!tile.template.actions || tile.template.actions.length === 0)
      return true;

    return tile.template.actions.every((action) => {
      const usage = this.getActionUsage(tile, action.id);
      return usage.isComplete;
    });
  }

  hasUnusedActions(tile: PlacedTile): boolean {
    if (!tile.template.actions || tile.template.actions.length === 0)
      return false;

    return tile.template.actions.some((action) => {
      const usage = this.getActionUsage(tile, action.id);
      return !usage.isComplete;
    });
  }

  private canAfford(cost: ResourceCost): boolean {
    if (!this.state || !this.state.resources) return false;
    if (cost.energy && this.state.resources.energy < cost.energy) return false;
    if (cost.money && this.state.resources.money < cost.money) return false;
    if (cost.materials && this.state.resources.materials < cost.materials)
      return false;
    if (cost.reputation && this.state.resources.reputation < cost.reputation)
      return false;
    if (cost.whitehats && this.state.resources.whitehats < cost.whitehats)
      return false;
    return true;
  }

  getMissingResources(cost: ResourceCost): ResourceCost {
    if (!this.state || !this.state.resources) return {};

    const missing: ResourceCost = {};
    if (cost.energy && this.state.resources.energy < cost.energy) {
      missing.energy = cost.energy - this.state.resources.energy;
    }
    if (cost.money && this.state.resources.money < cost.money) {
      missing.money = cost.money - this.state.resources.money;
    }
    if (cost.materials && this.state.resources.materials < cost.materials) {
      missing.materials = cost.materials - this.state.resources.materials;
    }
    if (cost.reputation && this.state.resources.reputation < cost.reputation) {
      missing.reputation = cost.reputation - this.state.resources.reputation;
    }
    if (cost.whitehats && this.state.resources.whitehats < cost.whitehats) {
      missing.whitehats = cost.whitehats - this.state.resources.whitehats;
    }
    return missing;
  }

  private spendResources(cost: ResourceCost) {
    if (!this.state || !this.state.resources) return;
    if (cost.energy) this.state.resources.energy -= cost.energy;
    if (cost.money) this.state.resources.money -= cost.money;
    if (cost.materials) this.state.resources.materials -= cost.materials;
    if (cost.reputation) this.state.resources.reputation -= cost.reputation;
    if (cost.whitehats) this.state.resources.whitehats -= cost.whitehats;
  }

  private gainResources(effect: ResourceCost) {
    if (!this.state || !this.state.resources) return;
    if (effect.energy) this.state.resources.energy += effect.energy;
    if (effect.money) this.state.resources.money += effect.money;
    if (effect.materials) this.state.resources.materials += effect.materials;
    if (effect.reputation) this.state.resources.reputation += effect.reputation;
    if (effect.whitehats) this.state.resources.whitehats += effect.whitehats;
  }

  getPassiveAbilitiesForTile(tile: PlacedTile) {
    return tile.template.passiveAbilities || [];
  }

  private checkGameOver() {
    if (!this.state) return;
    // Check win
    if (this.victoryPoints >= WIN_VP_THRESHOLD) {
      this.state.gameStatus = "won";
      return;
    }

    // Check loss - energy
    if (this.state.resources.energy <= 0) {
      this.state.gameStatus = "lost";
      this.state.lossReason = "Out of energy";
      return;
    }

    // Check loss - full board
    if (this.tilesPlaced >= GRID_WIDTH * GRID_HEIGHT) {
      if (this.victoryPoints < WIN_VP_THRESHOLD) {
        this.state.gameStatus = "lost";
        this.state.lossReason = "Board full, not enough VP";
      }
    }
  }

  resetGame() {
    console.log("[v0] resetGame called");
    clearGameState();
    // Re-initialize
    const emptyGrid: (PlacedTile | null)[][] = Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(null));

    const startPos: Position = { x: 2, y: 2 };

    emptyGrid[startPos.y][startPos.x] = {
      position: startPos,
      template: STARTER_TILE,
      rotation: 0,
      claimedActions: [],
      actionUsage: {},
    };

    runInAction(() => {
      this.state = {
        grid: emptyGrid,
        playerPosition: startPos,
        resources: {
          energy: STARTING_ENERGY,
          money: 10,
          materials: 5,
          reputation: 3,
          whitehats: STARTING_WHITEHATS,
        },
        isDrafting: false,
        draftOptions: [],
        selectedTilePosition: startPos,
        gameStatus: "playing",
        repeatableActionUsage: {},
        passiveVP: 0,
        questProgress: {},
        completedQuests: {},
        messageLog: [],
        focusMode: "grid",
        focusedActionIndex: 0,
      };
    });

    console.log("[v0] Game reset complete, new state:", this.state);
    // Add initial log message
    this.addLogMessage("Game started! Welcome to the neighbourhood.");
  }

  save() {
    if (!this.state) return;
    saveGameState(this.state);
  }

  load() {
    console.log("[v0] load called");
    const loaded = loadGameState();
    if (loaded) {
      console.log("[v0] Loaded state from localStorage:", loaded);
      runInAction(() => {
        this.state = loaded;
      });
      return true;
    }
    console.log("[v0] No saved state found");
    return false;
  }
}

export const gameStore = new GameStore();
