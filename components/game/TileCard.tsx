"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  Coins,
  Hammer,
  Users,
  Trophy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import type { TileTemplate, ResourceCost } from "@/game/types/game";
import { getDoorAfterRotation } from "@/game/engine/rotation";

interface TileCardProps {
  tile: TileTemplate;
  rotation?: number;
  scale?: number; // Scale factor (0.5 for 50% smaller)
  onClick?: () => void;
  showDoors?: boolean;
}

export const TileCard: React.FC<TileCardProps> = ({
  tile,
  rotation = 0,
  scale = 1,
  onClick,
  showDoors = true,
}) => {
  const borderColorClasses: Record<string, string> = {
    starter: "border-gray-600",
    orange: "border-orange-600",
    green: "border-green-600",
    blue: "border-blue-600",
    purple: "border-purple-600",
  };

  const formatResourcesWithIcons = (
    resources: ResourceCost,
    isCost: boolean = false
  ): React.ReactNode[] => {
    const resourceConfig: Record<
      string,
      { icon: React.ReactNode; color: string; label: string }
    > = {
      energy: {
        icon: <Zap className="w-4 h-4" />,
        color: "text-yellow-500",
        label: "Energy",
      },
      money: {
        icon: <Coins className="w-4 h-4" />,
        color: "text-green-500",
        label: "Money",
      },
      materials: {
        icon: <Hammer className="w-4 h-4" />,
        color: "text-blue-500",
        label: "Materials",
      },
      reputation: {
        icon: <Users className="w-4 h-4" />,
        color: "text-purple-500",
        label: "Reputation",
      },
      whitehats: {
        icon: <GraduationCap className="w-4 h-4" />,
        color: "text-white",
        label: "Whitehats",
      },
    };

    return Object.entries(resources)
      .filter(([_, value]) => value !== 0)
      .map(([key, value]) => {
        const config = resourceConfig[key];
        if (!config) return null;

        const displayValue = isCost ? Math.abs(value) : value;
        const sign = isCost ? "-" : value > 0 ? "+" : "";

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className={config.color}>{config.icon}</span>
            <span className="text-xs">
              {sign}
              {displayValue} {config.label}
            </span>
          </div>
        );
      })
      .filter(Boolean) as React.ReactNode[];
  };

  const doors = showDoors
    ? {
        N: getDoorAfterRotation(tile.doors, rotation, "N"),
        E: getDoorAfterRotation(tile.doors, rotation, "E"),
        S: getDoorAfterRotation(tile.doors, rotation, "S"),
        W: getDoorAfterRotation(tile.doors, rotation, "W"),
      }
    : { N: false, E: false, S: false, W: false };

  const cardHeight = scale === 0.5 ? 300 : 600;
  const imageHeight = scale === 0.5 ? 96 : 192; // h-48 = 192px, half = 96px

  return (
    <Card
      className={`${
        onClick ? "cursor-pointer hover:scale-105" : ""
      } transition-all border-4 ${
        borderColorClasses[tile.color]
      } w-full flex flex-col`}
      style={{
        gap: 0,
        padding: 0,
        height: `${cardHeight}px`,
      }}
      onClick={onClick}
    >
      <div
        className={`relative w-full rounded-t-lg overflow-hidden flex-shrink-0`}
        style={{ height: `${imageHeight}px` }}
      >
        <img
          src={tile.backgroundImageUrl}
          alt={tile.name}
          className="w-full h-full object-cover"
        />
        {/* Black overlay with 20% opacity */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Drafting cost in top-left */}
        {tile.draftingCost > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 rounded-md px-2 py-1">
            <span
              className={`${
                scale === 0.5 ? "text-lg" : "text-2xl"
              } font-bold text-white`}
            >
              {tile.draftingCost}
            </span>
            <GraduationCap
              className={`${scale === 0.5 ? "w-4 h-4" : "w-6 h-6"} text-white`}
            />
          </div>
        )}

        {/* Door indicators */}
        {doors.N && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <ChevronUp
              className={`${
                scale === 0.5 ? "w-5 h-5" : "w-10 h-10"
              } text-white drop-shadow-lg stroke-[3]`}
            />
          </div>
        )}
        {doors.S && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <ChevronDown
              className={`${
                scale === 0.5 ? "w-5 h-5" : "w-10 h-10"
              } text-white drop-shadow-lg stroke-[3]`}
            />
          </div>
        )}
        {doors.E && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <ChevronRight
              className={`${
                scale === 0.5 ? "w-5 h-5" : "w-10 h-10"
              } text-white drop-shadow-lg stroke-[3]`}
            />
          </div>
        )}
        {doors.W && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <ChevronLeft
              className={`${
                scale === 0.5 ? "w-5 h-5" : "w-10 h-10"
              } text-white drop-shadow-lg stroke-[3]`}
            />
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center justify-center pt-2">
        <div className="text-sm font-medium pt-1">{tile.name}</div>
      </div>
      <div className="pt-0 space-y-3 flex-1 overflow-y-auto flex justify-center flex-col px-4">
        {/* Actions */}
        {tile.actions && tile.actions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs">Actions:</h4>
            {tile.actions.map((action) => (
              <div key={action.id} className="text-xs space-y-1">
                {/* <div className="font-medium">{action.label}</div> */}
                {action.cost && (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-muted-foreground">Cost:</span>
                    {formatResourcesWithIcons(action.cost, true)}
                  </div>
                )}
                {action.effect && Object.keys(action.effect).length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-muted-foreground">Effect:</span>
                    {formatResourcesWithIcons(action.effect, false)}
                  </div>
                )}
                {action.vpFlat && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Trophy className="w-3 h-3 text-orange-500" />
                    <span>+{action.vpFlat} VP</span>
                  </div>
                )}
                {action.maxUses && (
                  <div className="text-xs text-muted-foreground">
                    (Up to {action.maxUses} times)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Passive Abilities */}
        {tile.passiveAbilities && tile.passiveAbilities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs">Passive:</h4>
            {tile.passiveAbilities.map((passive) => {
              const colorNames: Record<string, string> = {
                orange: "Orange",
                green: "Green",
                blue: "Blue",
                purple: "Purple",
              };
              return (
                <div key={passive.id} className="text-xs space-y-1">
                  {/* <div className="font-medium">{passive.label}</div> */}
                  <div className="text-muted-foreground">
                    When placing {colorNames[passive.triggerColor]} tile:
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    {formatResourcesWithIcons(passive.reward, false)}
                    {passive.reward.vpFlat && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Trophy className="w-3 h-3 text-orange-500" />
                        <span>+{passive.reward.vpFlat} VP</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VP Logic */}
        {tile.vpLogic && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">
              Victory Points:
            </h4>
            <div className="text-xs space-y-1">
              {tile.vpLogic.flat && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Trophy className="w-3 h-3 text-orange-500" />
                  <span>+{tile.vpLogic.flat} VP</span>
                </div>
              )}
              {tile.vpLogic.perColorType &&
                Object.entries(tile.vpLogic.perColorType).map(([color, vp]) => (
                  <div
                    key={color}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Trophy className="w-3 h-3 text-orange-500" />
                    <span>
                      +{vp} VP per {color} tile
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Quest */}
        {tile.quest && (
          <div className="space-y-2">
            <h4 className="text-xs">Quest:</h4>
            <div className="text-xs space-y-1">
              {/* <div className="font-medium">{tile.quest.label}</div> */}
              <div className="text-muted-foreground">
                {tile.quest.description}
              </div>
              {tile.quest.reward && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-muted-foreground">Reward:</span>
                  {formatResourcesWithIcons(tile.quest.reward, false)}
                  {tile.quest.reward.vpFlat && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Trophy className="w-3 h-3 text-orange-500" />
                      <span>+{tile.quest.reward.vpFlat} VP</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
