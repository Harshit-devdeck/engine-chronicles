import { useRef, useState, useCallback, useMemo } from "react";
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

  const filteredPosts = useMemo(() => {
    if (selectedCompanies.length === 0) return posts;
    return posts.filter((p) =>
      p.companies?.some((c) => selectedCompanies.includes(c.id))
    );
  }, [posts, selectedCompanies]);

  // Group by decade
  const decades = useMemo(() => {
    const map = new Map<number, Post[]>();
    filteredPosts.forEach((p) => {
      const decade = Math.floor(p.year / 10) * 10;
      if (!map.has(decade)) map.set(decade, []);
      map.get(decade)!.push(p);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filteredPosts]);

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

  if (filteredPosts.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-serif text-xl text-muted-foreground italic">
          No engines found for the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="flex gap-0 pb-8 pt-4 px-8 min-w-max">
          {decades.map(([decade, deckPosts], i) => (
            <div key={decade} className="flex items-start">
              {/* Decade separator */}
              <div className="flex flex-col items-center mr-6 pt-2">
                <span className="font-serif text-2xl font-bold text-foreground/80 mb-2">
                  {decade}s
                </span>
                <div className="w-px h-8 bg-border" />
              </div>

              {/* Cards for this decade */}
              <div className="flex gap-6 mr-12">
                {deckPosts.map((post) => (
                  <EngineCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Scroll hints */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default Timeline;
