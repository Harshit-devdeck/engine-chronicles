import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ArrowLeftRight, Check } from "lucide-react";
import type { Post } from "@/hooks/use-engine-data";

interface EngineComparisonProps {
  posts: Post[];
}

const EngineComparison = ({ posts }: EngineComparisonProps) => {
  const [engineA, setEngineA] = useState<Post | null>(null);
  const [engineB, setEngineB] = useState<Post | null>(null);
  const [selectingSlot, setSelectingSlot] = useState<"A" | "B" | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        p.engine_name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.companies?.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [posts, search]);

  // Gather all spec keys from both engines
  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    const specsA = (engineA?.specs as Record<string, string>) ?? {};
    const specsB = (engineB?.specs as Record<string, string>) ?? {};
    Object.keys(specsA).forEach((k) => keys.add(k));
    Object.keys(specsB).forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [engineA, engineB]);

  const selectEngine = (post: Post) => {
    if (selectingSlot === "A") setEngineA(post);
    else setEngineB(post);
    setSelectingSlot(null);
    setSearch("");
  };

  const hasSelection = engineA || engineB;
  const hasBoth = engineA && engineB;

  return (
    <div className="w-full">
      {/* Selection bar */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        {/* Slot A */}
        <SlotButton
          engine={engineA}
          slot="A"
          isSelecting={selectingSlot === "A"}
          onSelect={() => setSelectingSlot(selectingSlot === "A" ? null : "A")}
          onClear={() => setEngineA(null)}
        />

        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/60 border border-border/40">
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Slot B */}
        <SlotButton
          engine={engineB}
          slot="B"
          isSelecting={selectingSlot === "B"}
          onSelect={() => setSelectingSlot(selectingSlot === "B" ? null : "B")}
          onClear={() => setEngineB(null)}
        />
      </div>

      {/* Dropdown selector */}
      <AnimatePresence>
        {selectingSlot && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="rounded-2xl border border-border/50 gradient-card shadow-medium p-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search engine for Slot ${selectingSlot}...`}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-[13px] font-sans text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 focus:shadow-glow transition-all mb-3"
              />
              <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-hide">
                {filtered.map((p) => {
                  const isSelected = p.id === engineA?.id || p.id === engineB?.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => !isSelected && selectEngine(p)}
                      disabled={isSelected}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-secondary/60 hover:shadow-soft cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {p.companies?.map((c) => (
                          <div
                            key={c.id}
                            className="w-2.5 h-2.5 rounded-full border-2"
                            style={{ backgroundColor: c.color, borderColor: c.color + "40" }}
                          />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-[14px] font-semibold text-foreground truncate">
                          {p.engine_name}
                        </p>
                        <div className="flex items-center gap-2">
                          {p.companies?.map((c) => (
                            <span key={c.id} className="text-[10px] font-sans font-medium" style={{ color: c.color }}>
                              {c.name}
                            </span>
                          ))}
                          <span className="text-[10px] text-muted-foreground">· {p.year}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-center text-[13px] font-sans text-muted-foreground py-6 italic">
                    No engines found
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison table */}
      {hasBoth && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border/50 gradient-card shadow-medium overflow-hidden"
        >
          {/* Header row */}
          <div className="grid grid-cols-[200px_1fr_1fr] border-b border-border/40">
            <div className="px-6 py-5">
              <span className="text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
                Specification
              </span>
            </div>
            <ComparisonHeader engine={engineA!} slot="A" />
            <ComparisonHeader engine={engineB!} slot="B" />
          </div>

          {/* Basic info rows */}
          <ComparisonRow label="Engine Name" valueA={engineA!.engine_name} valueB={engineB!.engine_name} />
          <ComparisonRow label="Year" valueA={String(engineA!.year)} valueB={String(engineB!.year)} />
          <ComparisonRow
            label="Manufacturers"
            valueA={engineA!.companies?.map((c) => c.name).join(", ") ?? "—"}
            valueB={engineB!.companies?.map((c) => c.name).join(", ") ?? "—"}
          />
          <ComparisonRow
            label="Vehicles"
            valueA={engineA!.vehicles?.join(", ") ?? "—"}
            valueB={engineB!.vehicles?.join(", ") ?? "—"}
          />

          {/* Spec rows */}
          {allSpecKeys.length > 0 && (
            <div className="border-t border-border/40">
              <div className="px-6 py-3 bg-secondary/30">
                <span className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                  Technical Specifications
                </span>
              </div>
              {allSpecKeys.map((key) => {
                const specsA = (engineA!.specs as Record<string, string>) ?? {};
                const specsB = (engineB!.specs as Record<string, string>) ?? {};
                return (
                  <ComparisonRow
                    key={key}
                    label={key.replace(/_/g, " ")}
                    valueA={specsA[key] ?? "—"}
                    valueB={specsB[key] ?? "—"}
                    highlight={specsA[key] !== specsB[key]}
                  />
                );
              })}
            </div>
          )}

          {allSpecKeys.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-[13px] font-sans text-muted-foreground italic">
                No technical specifications available for comparison
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {!hasSelection && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl gradient-card border border-border/40 shadow-soft flex items-center justify-center mb-4">
            <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-serif text-xl font-semibold text-foreground mb-2">Compare Engines</p>
          <p className="text-[13px] font-sans text-muted-foreground max-w-sm text-center leading-relaxed">
            Select two engines above to compare their specifications side by side
          </p>
        </div>
      )}
    </div>
  );
};

/* Sub-components */

function SlotButton({
  engine,
  slot,
  isSelecting,
  onSelect,
  onClear,
}: {
  engine: Post | null;
  slot: "A" | "B";
  isSelecting: boolean;
  onSelect: () => void;
  onClear: () => void;
}) {
  const colorVar = slot === "A" ? "var(--compare-a)" : "var(--compare-b)";

  return (
    <div className="flex-1 min-w-[200px]">
      {engine ? (
        <div
          className="relative flex items-center gap-3 px-5 py-4 rounded-2xl border-2 gradient-card shadow-soft"
          style={{ borderColor: `hsl(${colorVar} / 0.35)` }}
        >
          <div className="flex items-center gap-1">
            {engine.companies?.map((c) => (
              <div
                key={c.id}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[15px] font-semibold text-foreground truncate">
              {engine.engine_name}
            </p>
            <p className="text-[11px] font-sans text-muted-foreground">
              {engine.companies?.map((c) => c.name).join(" · ")} · {engine.year}
            </p>
          </div>
          <button
            onClick={onClear}
            className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      ) : (
        <button
          onClick={onSelect}
          className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-dashed transition-all ${
            isSelecting
              ? "border-accent/50 bg-accent/5 shadow-glow"
              : "border-border/50 hover:border-accent/30 hover:bg-secondary/30"
          }`}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-sans font-bold"
            style={{
              backgroundColor: `hsl(${colorVar} / 0.12)`,
              color: `hsl(${colorVar})`,
            }}
          >
            {slot}
          </div>
          <div className="text-left">
            <p className="text-[13px] font-sans font-medium text-foreground">
              {isSelecting ? "Selecting..." : "Select Engine"}
            </p>
            <p className="text-[11px] font-sans text-muted-foreground">
              Click to choose
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${isSelecting ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

function ComparisonHeader({ engine, slot }: { engine: Post; slot: "A" | "B" }) {
  const colorVar = slot === "A" ? "var(--compare-a)" : "var(--compare-b)";

  return (
    <div
      className="px-6 py-5 border-l border-border/40"
      style={{ backgroundColor: `hsl(${colorVar} / 0.04)` }}
    >
      <div className="flex items-center gap-2 mb-1">
        {engine.companies?.map((c) => (
          <span key={c.id} className="text-[10px] font-sans font-semibold tracking-wider uppercase" style={{ color: c.color }}>
            {c.name}
          </span>
        ))}
      </div>
      <p className="font-serif text-[16px] font-semibold text-foreground leading-tight">
        {engine.engine_name}
      </p>
      <p className="text-[11px] font-sans text-muted-foreground mt-0.5 tabular-nums">{engine.year}</p>
    </div>
  );
}

function ComparisonRow({
  label,
  valueA,
  valueB,
  highlight = false,
}: {
  label: string;
  valueA: string;
  valueB: string;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[200px_1fr_1fr] border-b border-border/20 last:border-0">
      <div className="px-6 py-3.5 flex items-center">
        <span className="text-[11px] font-sans font-medium tracking-wide capitalize text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={`px-6 py-3.5 border-l border-border/20 ${
          highlight ? "bg-[hsl(var(--compare-a)/0.04)]" : ""
        }`}
      >
        <span className="text-[13px] font-sans font-medium text-foreground">{valueA}</span>
      </div>
      <div
        className={`px-6 py-3.5 border-l border-border/20 ${
          highlight ? "bg-[hsl(var(--compare-b)/0.04)]" : ""
        }`}
      >
        <span className="text-[13px] font-sans font-medium text-foreground">{valueB}</span>
      </div>
    </div>
  );
}

export default EngineComparison;
