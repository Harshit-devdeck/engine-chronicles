import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import type { Post, EngineRelationship } from "@/hooks/use-engine-data";
import EngineCard from "./EngineCard";

interface TimelineProps {
  posts: Post[];
  relationships: EngineRelationship[];
  selectedCompanies: string[];
}

const Timeline = ({ posts, relationships, selectedCompanies }: TimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const allPostsWithDim = useMemo(() => {
    if (selectedCompanies.length === 0) return posts.map((p) => ({ ...p, dimmed: false }));
    return posts.map((p) => ({
      ...p,
      dimmed: !p.companies?.some((c) => selectedCompanies.includes(c.id)),
    }));
  }, [posts, selectedCompanies]);

  // Group by decade
  const decades = useMemo(() => {
    const map = new Map<number, (Post & { dimmed: boolean })[]>();
    allPostsWithDim.forEach((p) => {
      const decade = Math.floor(p.year / 10) * 10;
      if (!map.has(decade)) map.set(decade, []);
      map.get(decade)!.push(p);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [allPostsWithDim]);

  // Visible relationship lines
  const visibleRelationships = useMemo(() => {
    const postIds = new Set(posts.map((p) => p.id));
    return relationships.filter(
      (r) => postIds.has(r.engine_id) && postIds.has(r.related_engine_id)
    );
  }, [posts, relationships]);

  // Connector lines SVG
  const [connectorPaths, setConnectorPaths] = useState<
    { path: string; type: string }[]
  >([]);

  const relationshipColor = (type: string) => {
    switch (type) {
      case "evolution": return "hsl(var(--rel-evolution))";
      case "collaboration": return "hsl(var(--rel-collaboration))";
      case "licensing": return "hsl(var(--rel-licensing))";
      case "modification": return "hsl(var(--rel-modification))";
      default: return "hsl(var(--border))";
    }
  };

  const computeConnectors = useCallback(() => {
    if (!scrollRef.current || visibleRelationships.length === 0) {
      setConnectorPaths([]);
      return;
    }
    const containerRect = scrollRef.current.getBoundingClientRect();
    const paths: typeof connectorPaths = [];

    visibleRelationships.forEach((rel) => {
      const fromEl = cardRefs.current.get(rel.engine_id);
      const toEl = cardRefs.current.get(rel.related_engine_id);
      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left + scrollRef.current!.scrollLeft;
      const fromY = fromRect.bottom - containerRect.top + 16;
      const toX = toRect.left + toRect.width / 2 - containerRect.left + scrollRef.current!.scrollLeft;
      const toY = toRect.bottom - containerRect.top + 16;

      const midY = Math.max(fromY, toY) + 40;
      const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

      paths.push({ path, type: rel.relationship_type });
    });

    setConnectorPaths(paths);
  }, [visibleRelationships]);

  useEffect(() => {
    computeConnectors();
    const timer = setTimeout(computeConnectors, 500);
    return () => clearTimeout(timer);
  }, [computeConnectors, allPostsWithDim]);

  // Smooth wheel scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY * 1.2;
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) return;
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft ?? 0));
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
      const walk = (x - startX) * 1.5;
      if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-serif text-xl text-muted-foreground italic">
          No engines found in this selection.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center gap-5 mb-6 ml-12">
        <span className="text-[9px] font-sans tracking-[0.25em] uppercase text-muted-foreground/60">
          Connections
        </span>
        {[
          { type: "evolution", label: "Evolution" },
          { type: "collaboration", label: "Collaboration" },
          { type: "licensing", label: "Licensing" },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div
              className="w-5 h-[2px] rounded-full"
              style={{ backgroundColor: relationshipColor(item.type) }}
            />
            <span className="text-[9px] font-sans text-muted-foreground/70">{item.label}</span>
          </div>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onScroll={computeConnectors}
      >
        {/* SVG connectors layer */}
        <svg
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ width: scrollRef.current?.scrollWidth ?? "100%", height: "100%" }}
        >
          {connectorPaths.map((cp, i) => (
            <path
              key={i}
              d={cp.path}
              fill="none"
              stroke={relationshipColor(cp.type)}
              strokeWidth={1.5}
              strokeOpacity={0.35}
              strokeDasharray={cp.type === "licensing" ? "6 4" : undefined}
            />
          ))}
        </svg>

        <div className="flex items-end pb-16 pt-6 px-12 min-w-max relative z-[2]">
          {decades.map(([decade, deckPosts], di) => (
            <motion.div
              key={decade}
              className="flex items-end"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: di * 0.08, duration: 0.5 }}
            >
              {/* Decade marker */}
              <div className="flex flex-col items-center mr-10 mb-0">
                <span className="font-serif text-[18px] font-semibold text-foreground/40 mb-3 tracking-tight">
                  {decade}s
                </span>
                <div className="w-px h-10 bg-gradient-to-b from-accent/30 to-transparent" />
                <div className="w-3 h-3 rounded-full bg-accent/25 mt-1 ring-[3px] ring-background shadow-glow" />
              </div>

              {/* Cards */}
              <div className="flex gap-7 mr-20">
                {deckPosts.map((post) => (
                  <div key={post.id} ref={(el) => setCardRef(post.id, el)}>
                    <EngineCard post={post} dimmed={post.dimmed} />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Central timeline track */}
        <div className="absolute bottom-[32px] left-0 right-0 z-[1] pointer-events-none">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-accent/15 to-transparent mt-[3px]" />
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />

      {/* Scroll hint */}
      <div className="flex items-center justify-center mt-8 gap-3 opacity-30">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-accent/30" />
        <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground">
          Scroll to explore the chronicle
        </span>
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-accent/30" />
      </div>
    </div>
  );
};

export default Timeline;
