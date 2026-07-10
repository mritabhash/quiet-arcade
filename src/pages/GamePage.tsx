import { useParams, Navigate, Link } from "react-router-dom";
import type { GameApi, GameId } from "../types";
import { GAME_INDEX } from "../data/games";
import { GameShell } from "../components/GameShell";
import { ArcaneBackdrop } from "../components/ArcaneBackdrop";
import { todayKey } from "../lib/date";
import { WordGridGame } from "../games/WordGrid";
import { PatternGroupsGame } from "../games/PatternGroups";
import { MiniCrosswordGame } from "../games/MiniCrossword";
import { HiddenStrandsGame } from "../games/HiddenStrands";
import { LetterHiveGame } from "../games/LetterHive";
import { MapDropGame } from "../games/MapDrop";
import { TimeCapsuleGame } from "../games/TimeCapsule";
import { BorderlineGame } from "../games/Borderline";
import { GlobeHuntGame } from "../games/GlobeHunt";
import { CountryShapeGame } from "../games/CountryShape";
import { TimeLensGame } from "../games/TimeLens";
import { HigherLowerGame } from "../games/HigherLower";
import { TriviaGame } from "../games/Trivia";
import { CatPairsGame } from "../games/CatPairs";
import { OddOneOutGame } from "../games/OddOneOut";

const COMPONENTS: Record<GameId, (props: { api: GameApi }) => React.ReactNode> = {
  "word-grid": WordGridGame,
  "pattern-groups": PatternGroupsGame,
  "mini-crossword": MiniCrosswordGame,
  "hidden-strands": HiddenStrandsGame,
  "letter-hive": LetterHiveGame,
  "map-drop": MapDropGame,
  "time-capsule": TimeCapsuleGame,
  "borderline": BorderlineGame,
  "globe-hunt": GlobeHuntGame,
  "country-shape": CountryShapeGame,
  "time-lens": TimeLensGame,
  "higher-lower": HigherLowerGame,
  "trivia": TriviaGame,
  "cat-pairs": CatPairsGame,
  "odd-one-out": OddOneOutGame,
};

export function GamePage() {
  const { gameId } = useParams();
  const meta = gameId ? GAME_INDEX[gameId as GameId] : undefined;
  if (!meta) return <Navigate to="/404" replace />;
  const Component = COMPONENTS[meta.id];

  return (
    <div>
      <ArcaneBackdrop seedParts={[todayKey(), meta.id]} />
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <Link
          to="/games"
          className="inline-flex items-center gap-1.5 text-sm font-semibold qa-muted transition-colors hover:text-[var(--ink)]"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 8 H3 M7 4 L3 8 L7 12" />
          </svg>
          All games
        </Link>
      </div>
      <GameShell meta={meta}>{(api) => <Component api={api} />}</GameShell>
    </div>
  );
}
