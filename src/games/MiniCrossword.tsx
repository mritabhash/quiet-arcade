import { useEffect, useMemo, useRef, useState } from "react";
import type { GameApi } from "../types";
import { mulberry32, pickIndex } from "../lib/random";
import { CROSSWORDS } from "../data/crosswords";
import { loadGameSave, storeGameSave } from "../lib/storage";
import { Button } from "../components/ui";

type Dir = "across" | "down";

interface CrosswordSave {
  cells: string[];
  checks: number;
  reveals: number;
}

export function MiniCrosswordGame({ api }: { api: GameApi }) {
  const puzzle = useMemo(() => {
    const rng = mulberry32(api.seed);
    return CROSSWORDS[pickIndex(rng, CROSSWORDS.length)];
  }, [api.seed]);

  const solution = useMemo(() => puzzle.rows.join(""), [puzzle]);

  const initial = useMemo(() => {
    if (api.mode === "daily") {
      const save = loadGameSave<CrosswordSave>("mini-crossword", api.dateKey);
      if (save && save.cells.length === 25) return save;
    }
    return { cells: Array(25).fill(""), checks: 0, reveals: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.mode, api.dateKey, api.seed]);

  const [cells, setCells] = useState<string[]>(initial.cells);
  const [checks, setChecks] = useState(initial.checks);
  const [reveals, setReveals] = useState(initial.reveals);
  const [wrongMarks, setWrongMarks] = useState<boolean[]>(Array(25).fill(false));
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<Dir>("across");
  const [finished, setFinished] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>(Array(25).fill(null));

  const persist = (nextCells: string[], nextChecks: number, nextReveals: number) => {
    if (api.mode === "daily") {
      storeGameSave<CrosswordSave>("mini-crossword", api.dateKey, {
        cells: nextCells,
        checks: nextChecks,
        reveals: nextReveals,
      });
    }
  };

  useEffect(() => {
    const complete = cells.every((c, i) => c === solution[i]);
    if (complete && !finished) {
      setFinished(true);
      const t = setTimeout(() => {
        const score = Math.max(5, 25 - checks * 2 - reveals * 5);
        api.finish({
          score,
          max: 25,
          perfect: checks === 0 && reveals === 0,
          label:
            checks === 0 && reveals === 0
              ? "Solved clean — no checks, no reveals."
              : `Solved with ${checks} check${checks === 1 ? "" : "s"} and ${reveals} reveal${reveals === 1 ? "" : "s"}.`,
        });
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [cells, solution, finished, checks, reveals, api]);

  const move = (from: number, dRow: number, dCol: number) => {
    const r = Math.floor(from / 5) + dRow;
    const c = (from % 5) + dCol;
    if (r < 0 || r > 4 || c < 0 || c > 4) return;
    const idx = r * 5 + c;
    setActive(idx);
    refs.current[idx]?.focus();
  };

  const setCell = (idx: number, val: string) => {
    const ch = val.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setCells((prev) => {
      const next = [...prev];
      next[idx] = ch;
      persist(next, checks, reveals);
      return next;
    });
    setWrongMarks((prev) => {
      const next = [...prev];
      next[idx] = false;
      return next;
    });
    if (ch) {
      if (dir === "across") move(idx, 0, 1);
      else move(idx, 1, 0);
    }
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !cells[idx]) {
      e.preventDefault();
      if (dir === "across") move(idx, 0, -1);
      else move(idx, -1, 0);
    } else if (e.key === "ArrowRight") move(idx, 0, 1);
    else if (e.key === "ArrowLeft") move(idx, 0, -1);
    else if (e.key === "ArrowDown") move(idx, 1, 0);
    else if (e.key === "ArrowUp") move(idx, -1, 0);
  };

  const check = () => {
    if (finished) return;
    setChecks((c) => {
      persist(cells, c + 1, reveals);
      return c + 1;
    });
    setWrongMarks(cells.map((c, i) => c !== "" && c !== solution[i]));
  };

  const revealCell = () => {
    if (finished) return;
    setReveals((r) => {
      const next = [...cells];
      next[active] = solution[active];
      setCells(next);
      persist(next, checks, r + 1);
      return r + 1;
    });
  };

  const activeRow = Math.floor(active / 5);
  const activeCol = active % 5;

  return (
    <div className="grid gap-8 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-4">
        <div className="grid grid-cols-5 gap-1" role="group" aria-label="Crossword grid">
          {cells.map((val, idx) => {
            const r = Math.floor(idx / 5);
            const c = idx % 5;
            const inActiveWord = dir === "across" ? r === activeRow : c === activeCol;
            return (
              <div key={idx} className="relative">
                {c === 0 && (
                  <span className="pointer-events-none absolute left-0.5 top-0 text-[9px] font-bold qa-muted">
                    {r + 1}
                  </span>
                )}
                {r === 0 && c > 0 && (
                  <span className="pointer-events-none absolute left-0.5 top-0 text-[9px] font-bold qa-muted">
                    {c + 1}
                  </span>
                )}
                <input
                  ref={(el) => {
                    refs.current[idx] = el;
                  }}
                  value={val}
                  aria-label={`Row ${r + 1}, column ${c + 1}`}
                  onChange={(e) => setCell(idx, e.target.value)}
                  onKeyDown={(e) => onKeyDown(idx, e)}
                  onFocus={() => setActive(idx)}
                  onClick={() => {
                    if (idx === active) setDir((d) => (d === "across" ? "down" : "across"));
                  }}
                  maxLength={2}
                  autoComplete="off"
                  className={`h-12 w-12 rounded-md border text-center font-display text-xl font-bold uppercase caret-transparent outline-none transition-colors sm:h-14 sm:w-14 ${
                    wrongMarks[idx]
                      ? "border-clay-500 bg-clay-100 text-clay-700 dark:bg-clay-900 dark:text-clay-200"
                      : idx === active
                        ? "border-teal-600 bg-teal-100 dark:bg-teal-900"
                        : inActiveWord
                          ? "border-[var(--line)] bg-[var(--card-2)]"
                          : "border-[var(--line)] bg-[var(--card)]"
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={check} disabled={finished}>
            Check (−2)
          </Button>
          <Button variant="secondary" onClick={revealCell} disabled={finished}>
            Reveal cell (−5)
          </Button>
        </div>
        <p className="text-xs qa-muted">
          {checks} checks · {reveals} reveals · click the active cell to switch direction
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {(["across", "down"] as const).map((d) => (
          <div key={d}>
            <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-widest qa-muted">
              {d}
            </h3>
            <ol className="space-y-1.5">
              {(d === "across" ? puzzle.across : puzzle.down).map((clue, i) => {
                const isActive = dir === d && (d === "across" ? activeRow : activeCol) === i;
                return (
                  <li key={i}>
                    <button
                      className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                        isActive ? "bg-teal-100 font-semibold dark:bg-teal-900" : "hover:bg-[var(--card-2)]"
                      }`}
                      onClick={() => {
                        setDir(d);
                        const idx = d === "across" ? i * 5 : i;
                        setActive(idx);
                        refs.current[idx]?.focus();
                      }}
                    >
                      <span className="mr-1.5 font-bold">{i + 1}.</span>
                      {clue}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
