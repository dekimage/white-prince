"use client";

import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Coins,
  Hammer,
  Users,
  Trophy,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TileCard } from "@/components/game/TileCard";
import { TILE_DECK } from "@/game/data/tiles";
import { useRouter } from "next/navigation";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_SLIDES = 7;

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  if (!isOpen) return null;

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  // Example tiles for demonstrations
  const exampleActiveTile =
    TILE_DECK.find((t) => t.id === "vp-garden") || TILE_DECK[0];
  const exampleQuestTile =
    TILE_DECK.find((t) => t.quest) ||
    TILE_DECK.find((t) => t.id === "quest-investment") ||
    TILE_DECK[0];
  const examplePassiveTile =
    TILE_DECK.find(
      (t) => t.passiveAbilities && t.passiveAbilities.length > 0
    ) ||
    TILE_DECK.find((t) => t.id === "economy-partnership") ||
    TILE_DECK[0];
  const exampleRepeatableTile =
    TILE_DECK.find((t) => t.actions?.some((a) => a.maxUses)) ||
    TILE_DECK.find((t) => t.id === "vp-monument") ||
    TILE_DECK[0];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="bg-card rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden relative border-2 border-primary flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-3xl font-bold">How to Play</h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {currentSlide === 0 && <SlideObjective />}
          {currentSlide === 1 && <SlideAvatar />}
          {currentSlide === 2 && <SlideResources />}
          {currentSlide === 3 && <SlideMovement />}
          {currentSlide === 4 && (
            <SlideTileEffects
              exampleActiveTile={exampleActiveTile}
              exampleQuestTile={exampleQuestTile}
              examplePassiveTile={examplePassiveTile}
              exampleRepeatableTile={exampleRepeatableTile}
            />
          )}
          {currentSlide === 5 && <SlideShortcuts />}
          {currentSlide === 6 && <SlideTips />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide
                    ? "bg-primary w-8"
                    : "bg-muted-foreground/30"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {currentSlide === TOTAL_SLIDES - 1 ? (
            <Button
              onClick={() => {
                onClose();
                router.push("/game?new=true");
              }}
              size="lg"
            >
              Play
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button variant="outline" onClick={nextSlide}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideAvatar() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center mb-8">
        Your Avatar & The Map
      </h2>

      <div className="space-y-6">
        <div className="bg-card border-2 border-primary rounded-lg p-6">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg flex items-center justify-center text-4xl">
              👤
            </div>
            <p className="text-2xl font-bold">This is you!</p>
          </div>

          <div className="space-y-4 text-lg">
            <p>
              There are <span className="font-bold">5x5 locations</span> in the
              map (grid) and you start with this avatar in the{" "}
              <span className="font-bold">center</span> representing where you
              are physically in your community.
            </p>
            <p>
              When you <span className="font-bold">move</span> - the avatar will
              show you exactly where you are on the map!
            </p>
          </div>
        </div>

        <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3 text-yellow-600">
            Important Note:
          </h3>
          <p className="text-lg">
            You can <span className="font-bold">click any tile</span> on the map
            to <span className="font-bold">inspect its details</span> even if
            you are not there, but to{" "}
            <span className="font-bold text-yellow-600">
              use it/interact with it
            </span>{" "}
            - your avatar{" "}
            <span className="font-bold text-yellow-600">MUST BE on it</span>!!!
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideObjective() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center mb-8">Objective</h2>

      <div className="space-y-4">
        <div className="bg-green-500/10 border-2 border-green-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-green-500 mb-3 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Win Condition
          </h3>
          <p className="text-lg">
            Gather{" "}
            <span className="font-bold text-green-500">
              100 VP (Neighbourhood Satisfaction Points)
            </span>{" "}
            to win the game!
          </p>
        </div>

        <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-red-500 mb-3">
            Lose Condition
          </h3>
          <p className="text-lg">
            If you run out of{" "}
            <span className="font-bold text-red-500">Energy</span> and you have
            less than 100 VP, you lose the game.
          </p>
        </div>

        <div className="bg-purple-500/10 border-2 border-purple-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-purple-500 mb-3">
            Mega Win Challenge
          </h3>
          <p className="text-lg">
            Try to win with 100 VP using as little land as possible (25 tiles
            max). Can you be efficient?
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideResources() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center mb-8">Resources</h2>
      <p className="text-center text-muted-foreground mb-6">
        You will manage different resources in the game to achieve your victory.
      </p>

      <div className="space-y-4">
        <ResourceCard
          icon={<Zap className="w-8 h-8" />}
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
          borderColor="border-yellow-500"
          name="Energy"
          theme="Energy used for driving and moving around the community but also spent as fuel or electricity."
          uses={[
            "MOVE: Spend 1 energy to MOVE (any direction regardless if new land or old)",
            "REROLL: Spend 1 energy to 'research' get 3 new options when drafting a land tile",
            "Activate establishments: Some tiles require energy as cost to activate them",
          ]}
        />

        <ResourceCard
          icon={<Coins className="w-8 h-8" />}
          color="text-green-500"
          bgColor="bg-green-500/10"
          borderColor="border-green-500"
          name="Money"
          theme="$$$"
          uses={[
            "Resource used for paying the cost to activate effects of different establishments",
          ]}
        />

        <ResourceCard
          icon={<Hammer className="w-8 h-8" />}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          borderColor="border-blue-500"
          name="Materials"
          theme="Utility, security, wifi, roads, education..."
          uses={[
            "Resource used for paying the cost to activate effects of different establishments",
          ]}
        />

        <ResourceCard
          icon={<Users className="w-8 h-8" />}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
          borderColor="border-purple-500"
          name="Reputation"
          theme="Social networks, connections, relationships"
          uses={[
            "Resource used for paying the cost to activate effects of different establishments",
          ]}
        />

        <ResourceCard
          icon={<GraduationCap className="w-8 h-8" />}
          color="text-white"
          bgColor="bg-gray-500/10"
          borderColor="border-gray-500"
          name="Whitehats"
          theme="Various good people willing to help you in your quest for better community and neighbourhood by employing them to perform some kind of work on that establishment/land."
          uses={[
            "Discover Tile: Tiles cost between 1 - 3 whitehats to establish on an empty location",
          ]}
        />

        <ResourceCard
          icon={<Trophy className="w-8 h-8" />}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
          borderColor="border-orange-500"
          name="Victory Points (VP)"
          theme="Community and neighbourhood satisfaction"
          uses={["Objective of the game (gain 100 to win)"]}
        />
      </div>
    </div>
  );
}

function ResourceCard({
  icon,
  color,
  bgColor,
  borderColor,
  name,
  theme,
  uses,
}: {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  name: string;
  theme: string;
  uses: string[];
}) {
  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-lg p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={color}>{icon}</div>
        <h3 className={`text-2xl font-bold ${color}`}>{name}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-3 italic">{theme}</p>
      <ul className="space-y-1">
        {uses.map((use, i) => (
          <li key={i} className="text-sm flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{use}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlideMovement() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center mb-8">
        Movement & Discovery
      </h2>

      <div className="space-y-6">
        <div className="bg-card border-2 border-primary rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4">1. Move</h3>
          <p className="text-lg mb-4">
            Use <span className="font-bold">arrow keys</span> (up, down, left,
            right) or <span className="font-bold">mouse click</span> + "Move
            Here" button.
          </p>
          <p className="text-lg">
            You may move to any previously explored tile or to a new empty
            location. When moving to a new empty location, you{" "}
            <span className="font-bold text-primary">DISCOVER A TILE</span>.
          </p>
        </div>

        <div className="bg-card border-2 border-primary rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4">2. Discover a Tile</h3>
          <p className="text-lg mb-4">
            When you move to a new empty location, you get a screen where you
            are presented with{" "}
            <span className="font-bold">3 tiles (establishments)</span> and you
            choose 1 to build on that land.
          </p>
          <p className="text-lg mb-4">
            Building it costs <span className="font-bold">1-3 whitehats</span>{" "}
            depending on the tile.
          </p>
          <p className="text-lg">
            You may additionally <span className="font-bold">Reroll</span> to
            get new 3 options. Rerolling costs{" "}
            <span className="font-bold">+1 energy</span> each time and can be
            done up to <span className="font-bold">3 times per draft</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideTileEffects({
  exampleActiveTile,
  exampleQuestTile,
  examplePassiveTile,
  exampleRepeatableTile,
}: {
  exampleActiveTile: any;
  exampleQuestTile: any;
  examplePassiveTile: any;
  exampleRepeatableTile: any;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center mb-8">Tile Effects</h2>
      <p className="text-center text-muted-foreground mb-6">
        After a tile is discovered and placed on the map, you can use its
        effects. This is the primary way you interact with tiles.
      </p>

      <div className="space-y-6">
        <div className="bg-card border-2 border-blue-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4 text-blue-500">
            1. Active Action
          </h3>
          <p className="text-lg mb-4">
            Click <span className="font-bold">"Use"</span> button to gain the
            effects and optionally pay the costs to activate them.
          </p>
          <div className="flex justify-center mt-4">
            <div style={{ maxWidth: "300px" }}>
              <TileCard tile={exampleActiveTile} scale={0.6} showDoors={true} />
            </div>
          </div>
        </div>

        <div className="bg-card border-2 border-green-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4 text-green-500">
            2. Active + Multi-use
          </h3>
          <p className="text-lg mb-4">
            Same as active effect but can be performed{" "}
            <span className="font-bold">multiple times</span> (has a limit X).
            You may come back to this tile later to use it again when you have
            enough resources.
          </p>
          <div className="flex justify-center mt-4">
            <div style={{ maxWidth: "300px" }}>
              <TileCard
                tile={exampleRepeatableTile}
                scale={0.6}
                showDoors={true}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border-2 border-purple-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4 text-purple-500">
            3. Passive (Triggered)
          </h3>
          <p className="text-lg mb-4">
            Some tiles have passive effects like{" "}
            <span className="font-bold">
              "each time you do X, they give you Y"
            </span>
            . These are automatically applied.
          </p>
          <div className="flex justify-center mt-4">
            <div style={{ maxWidth: "300px" }}>
              <TileCard
                tile={examplePassiveTile}
                scale={0.6}
                showDoors={true}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border-2 border-orange-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4 text-orange-500">4. Quest</h3>
          <p className="text-lg mb-4">
            Some tiles are quest type: they require you to perform some action{" "}
            <span className="font-bold">X times</span> to give you reward.
          </p>
          <p className="text-lg mb-4 italic">
            Example: "Spend money 5 times on establishment tiles" → Reward: 10
            VP
          </p>
          <div className="flex justify-center mt-4">
            <div style={{ maxWidth: "300px" }}>
              <TileCard tile={exampleQuestTile} scale={0.6} showDoors={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideShortcuts() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center mb-8">
        Keyboard Shortcuts
      </h2>
      <p className="text-center text-muted-foreground mb-6">
        Play the entire game using only your keyboard! No mouse required.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border-2 border-primary rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">During Map</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-bold">Arrow keys</span> → Move + explore
              location
            </li>
            <li>
              <span className="font-bold">Enter/Space</span> → Open tile details
              (focus on action)
            </li>
          </ul>
        </div>

        <div className="bg-card border-2 border-primary rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">During Card Details</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-bold">Enter/Space</span> → Use a tile's
              effect (activated)
            </li>
            <li>
              <span className="font-bold">Arrow keys Up/Down</span> → Navigate
              between abilities
            </li>
            <li>
              <span className="font-bold">ESC</span> → Go back to the map
            </li>
          </ul>
        </div>

        <div className="bg-card border-2 border-primary rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">During Drafting</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-bold">Arrow keys Left/Right</span> → Choose
              different tile
            </li>
            <li>
              <span className="font-bold">Arrow keys Up/Down</span> → Move
              between reroll button and tiles
            </li>
            <li>
              <span className="font-bold">Enter/Space</span> → Select a tile
            </li>
            <li>
              <span className="font-bold">ESC</span> → Hide/show dialog to see
              the map
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
        <p className="text-lg font-bold">
          TLDR: Use <span className="text-primary">[Arrow keys]</span> +{" "}
          <span className="text-primary">[Enter/Space]</span> and occasionally{" "}
          <span className="text-primary">[ESC]</span> → will be enough to play
          the game keyboard only, mouse free!
        </p>
      </div>
    </div>
  );
}

function SlideTips() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center mb-8">Tips & Game Log</h2>

      <div className="space-y-6">
        <div className="bg-card border-2 border-blue-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4 text-blue-500">Chat Log</h3>
          <p className="text-lg mb-4">
            You can find detailed logs of all actions performed during your game
            run as a history log. You can see exactly what happened, what got
            triggered to understand your actions, learn and become good enough
            to win the game!
          </p>
          <p className="text-sm text-muted-foreground">
            The game log is located on the left side of the screen during
            gameplay.
          </p>
        </div>

        <div className="bg-card border-2 border-green-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4 text-green-500">Pro Tips</h3>
          <ul className="space-y-3 text-lg">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Explore combos between different tile types</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Plan your whitehats spending - some tiles cost more but give
                better rewards
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Keep an eye on your energy - running out means game over!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Quest tiles can give big rewards - complete them when possible
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Passive abilities trigger automatically - place them early on!
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
          <p className="text-2xl font-bold">
            Finally, have fun, explore combos and try to win at least 1 time! 🎮
          </p>
        </div>
      </div>
    </div>
  );
}
