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

  const filteredPosts = useMemo(() => {
    if (selectedCompanies.length === 0) return posts;
    return posts.filter((p) =>
      p.companies?.some((c) => selectedCompanies.includes(c.id))
    );
  }, [posts, selectedCompanies]);

  // Determine which posts are dimmed (not matching filter but still shown for context)
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
    { path: string; type: string; fromId: string; toId: string }[]
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
      const fromY = fromRect.bottom - containerRect.top + 16;
      const toX = toRect.left + toRect.width / 2 - containerRect.left + scrollRef.current!.scrollLeft;
      const toY = toRect.bottom - containerRect.top + 16;

      const midY = Math.max(fromY, toY) + 30;
      const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

      paths.push({ path, type: rel.relationship_type, fromId: rel.engine_id, toId: rel.related_engine_id });
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

  const scrollToEngine = useCallback((engineId: string) => {
    const el = cardRefs.current.get(engineId);
    if (el && scrollRef.current) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const cardRect = el.getBoundingClientRect();
      const targetScroll =
        scrollRef.current.scrollLeft + cardRect.left - containerRect.left - containerRect.width / 2 + cardRect.width / 2;
      scrollRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
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
          {connectorPaths.map((cp, i) => (
            <g key={i}>
              <path
                d={cp.path}
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                opacity={0.35}
              />
              {/* Small label at midpoint */}
              <text
                x={0}
                y={0}
                fontSize={9}
                fill="hsl(var(--muted-foreground))"
                textAnchor="middle"
                className="font-sans"
                opacity={0.6}
              >
                {/* Label computed via path midpoint would need more logic */}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex items-end pb-12 pt-6 px-12 min-w-max relative z-[2]">
          {decades.map(([decade, deckPosts], di) => (
            <div key={decade} className="flex items-end">
              {/* Decade marker */}
              <div className="flex flex-col items-center mr-8 mb-0">
                <span className="font-serif text-lg font-semibold text-foreground/60 mb-3 tracking-tight">
                  {decade}s
                </span>
                <div className="w-px h-6 bg-gradient-to-b from-border to-transparent" />
                {/* Decade dot on timeline */}
                <div className="w-2 h-2 rounded-full bg-border mt-1" />
              </div>

              {/* Cards */}
              <div className="flex gap-8 mr-16">
                {deckPosts.map((post) => (
                  <div
                    key={post.id}
                    ref={(el) => setCardRef(post.id, el)}
                  >
                    <EngineCard post={post} dimmed={post.dimmed} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Central timeline track */}
        <div className="absolute bottom-[26px] left-0 right-0 h-px z-[1]">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-70" />
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />

      {/* Scroll hint */}
      <div className="flex items-center justify-center mt-4 gap-2 opacity-40">
        <div className="w-8 h-px bg-foreground/30" />
        <span className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground">
          Scroll to explore
        </span>
        <div className="w-8 h-px bg-foreground/30" />
      </div>
    </div>
  );
};

export default Timeline;
