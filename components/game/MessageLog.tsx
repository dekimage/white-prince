"use client";

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { gameStore } from "@/game/store/GameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Zap,
  Coins,
  Hammer,
  Users,
  Trophy,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import type { ResourceCost } from "@/game/types/game";

export const MessageLog = observer(() => {
  const { state } = gameStore;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isLogVisible, setIsLogVisible] = useState(true);
  const [hideMovementLogs, setHideMovementLogs] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && isLogVisible) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state?.messageLog?.length, isLogVisible]);

  const formatResourceChange = (
    resources: ResourceCost & { vpFlat?: number }
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
    };

    const changes: React.ReactNode[] = [];

    Object.entries(resources).forEach(([key, value]) => {
      if (key === "vpFlat") {
        if (value) {
          changes.push(
            <span key="vp" className="flex items-center gap-1 text-xs">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span className={value > 0 ? "text-green-600" : "text-red-600"}>
                {value > 0 ? "+" : ""}
                {value} VP
              </span>
            </span>
          );
        }
        return;
      }

      const config = resourceConfig[key];
      if (!config || !value || value === 0) return;

      const isPositive = value > 0;
      changes.push(
        <span
          key={key}
          className={`flex items-center gap-1 text-xs ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          <span className={config.color}>{config.icon}</span>
          <span>
            {isPositive ? "+" : ""}
            {value} {config.label}
          </span>
        </span>
      );
    });

    return changes;
  };

  const filteredMessages = React.useMemo(() => {
    if (!state?.messageLog) return [];
    if (!hideMovementLogs) return state.messageLog;
    return state.messageLog.filter(
      (msg) => !msg.message.startsWith("You moved to")
    );
  }, [state?.messageLog, hideMovementLogs]);

  return (
    <div className="h-full flex flex-col">
      <CardHeader
        className="flex-shrink-0 border-b pt-2 px-3"
        style={{ paddingBottom: 0 }}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Game Log</CardTitle>
          <div className="flex items-center gap-1">
            {/* Hide movement logs toggle */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setHideMovementLogs(!hideMovementLogs)}
                >
                  <Filter
                    className={`h-4 w-4 ${
                      hideMovementLogs ? "text-primary" : ""
                    }`}
                  />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                <p className="text-sm">Hide movement logs</p>
              </HoverCardContent>
            </HoverCard>

            {/* Hide/show log toggle */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsLogVisible(!isLogVisible)}
                >
                  {isLogVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                <p className="text-sm">
                  {isLogVisible ? "Hide log" : "Show log"}
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </CardHeader>
      {isLogVisible && (
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <CardContent className="space-y-2 p-4">
            {!state || !filteredMessages || filteredMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center">
                Game log will appear here
              </p>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="text-xs space-y-1 p-2 rounded-md bg-muted/50 border border-border/50"
                >
                  <div className="text-foreground">{msg.message}</div>
                  {msg.resourceChanges && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {formatResourceChange(msg.resourceChanges)}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </div>
      )}
    </div>
  );
});

MessageLog.displayName = "MessageLog";
