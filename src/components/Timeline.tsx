import { useRef, useState, useCallback, useMemo, useEffect } from "react";
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
      const fromY = fromRect.bottom - containerRect.top + 20;
      const toX = toRect.left + toRect.width / 2 - containerRect.left + scrollRef.current!.scrollLeft;
      const toY = toRect.bottom - containerRect.top + 20;

      const midY = Math.max(fromY, toY) + 36;
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
          No engines found.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
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
          <defs>
            <linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
              <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {connectorPaths.map((cp, i) => (
            <path
              key={i}
              d={cp.path}
              fill="none"
              stroke="url(#connector-gradient)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          ))}
        </svg>

        <div className="flex items-end pb-14 pt-6 px-12 min-w-max relative z-[2]">
          {decades.map(([decade, deckPosts]) => (
            <div key={decade} className="flex items-end">
              {/* Decade marker — engineered precision */}
              <div className="flex flex-col items-center mr-10 mb-0">
                <span className="font-serif text-lg font-bold text-foreground/50 mb-3 tracking-tight">
                  {decade}s
                </span>
                <div className="w-px h-8 bg-gradient-to-b from-accent/40 to-transparent" />
                {/* Decade node */}
                <div className="w-2.5 h-2.5 rounded-full bg-accent/40 mt-1 ring-2 ring-background" />
              </div>

              {/* Cards */}
              <div className="flex gap-8 mr-16">
                {deckPosts.map((post) => (
                  <div key={post.id} ref={(el) => setCardRef(post.id, el)}>
                    <EngineCard post={post} dimmed={post.dimmed} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Central timeline track — refined double line */}
        <div className="absolute bottom-[30px] left-0 right-0 z-[1] pointer-events-none">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-60" />
          <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/20 to-transparent mt-[2px] opacity-40" />
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />

      {/* Scroll hint */}
      <div className="flex items-center justify-center mt-6 gap-3 opacity-35">
        <div className="w-10 h-px bg-gradient-to-r from-transparent to-accent/40" />
        <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground">
          Scroll to explore
        </span>
        <div className="w-10 h-px bg-gradient-to-l from-transparent to-accent/40" />
      </div>
    </div>
  );
};

export default Timeline;