import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Post, EngineRelationship } from "@/hooks/use-engine-data";

interface NetworkGraphProps {
  posts: Post[];
  relationships: EngineRelationship[];
  selectedCompanies: string[];
}

interface NodePosition {
  x: number;
  y: number;
}

const NODE_RADIUS = 140;
const LINK_DISTANCE = 320;

function computeLayout(
  posts: Post[],
  relationships: EngineRelationship[]
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  if (posts.length === 0) return positions;

  // Build adjacency for force-directed-like layout
  const adj = new Map<string, Set<string>>();
  posts.forEach((p) => adj.set(p.id, new Set()));
  relationships.forEach((r) => {
    adj.get(r.engine_id)?.add(r.related_engine_id);
    adj.get(r.related_engine_id)?.add(r.engine_id);
  });

  // Group by company for initial placement
  const companyGroups = new Map<string, Post[]>();
  posts.forEach((p) => {
    const companyId = p.companies?.[0]?.id ?? "unknown";
    if (!companyGroups.has(companyId)) companyGroups.set(companyId, []);
    companyGroups.get(companyId)!.push(p);
  });

  const groups = Array.from(companyGroups.entries());
  // Sort groups alphabetically for deterministic order
  groups.sort((a, b) => a[0].localeCompare(b[0]));
  const centerX = 600;
  const centerY = 450;

  // Place groups in a circle, nodes within each group spread by year (deterministic)
  groups.forEach(([, groupPosts], gi) => {
    const angle = (gi / groups.length) * Math.PI * 2 - Math.PI / 2;
    const groupRadius = 250 + groups.length * 35;
    const gx = centerX + Math.cos(angle) * groupRadius;
    const gy = centerY + Math.sin(angle) * groupRadius;

    // Sort by year for consistent ordering within group
    const sorted = [...groupPosts].sort((a, b) => a.year - b.year || a.engine_name.localeCompare(b.engine_name));
    sorted.forEach((p, i) => {
      const spread = sorted.length > 1 ? (i / (sorted.length - 1) - 0.5) * 220 : 0;
      const perpAngle = angle + Math.PI / 2;
      // Deterministic offset based on index instead of random
      const offsetX = ((i % 3) - 1) * 15;
      const offsetY = (Math.floor(i / 3) % 2 === 0 ? 1 : -1) * 10;
      positions.set(p.id, {
        x: gx + Math.cos(perpAngle) * spread + offsetX,
        y: gy + Math.sin(perpAngle) * spread + offsetY,
      });
    });
  });

  // Simple force simulation (few iterations for a clean layout)
  for (let iter = 0; iter < 80; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    posts.forEach((p) => forces.set(p.id, { fx: 0, fy: 0 }));

    // Repulsion between all nodes
    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const a = positions.get(posts[i].id)!;
        const b = positions.get(posts[j].id)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const repulsion = 25000 / (dist * dist);
        const fx = (dx / dist) * repulsion;
        const fy = (dy / dist) * repulsion;
        forces.get(posts[i].id)!.fx -= fx;
        forces.get(posts[i].id)!.fy -= fy;
        forces.get(posts[j].id)!.fx += fx;
        forces.get(posts[j].id)!.fy += fy;
      }
    }

    // Attraction along edges
    relationships.forEach((r) => {
      const a = positions.get(r.engine_id);
      const b = positions.get(r.related_engine_id);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const attraction = (dist - LINK_DISTANCE) * 0.005;
      const fx = (dx / Math.max(dist, 1)) * attraction;
      const fy = (dy / Math.max(dist, 1)) * attraction;
      forces.get(r.engine_id)!.fx += fx;
      forces.get(r.engine_id)!.fy += fy;
      forces.get(r.related_engine_id)!.fx -= fx;
      forces.get(r.related_engine_id)!.fy -= fy;
    });

    // Centering force
    posts.forEach((p) => {
      const pos = positions.get(p.id)!;
      forces.get(p.id)!.fx += (centerX - pos.x) * 0.002;
      forces.get(p.id)!.fy += (centerY - pos.y) * 0.002;
    });

    // Apply forces
    const damping = 0.3;
    posts.forEach((p) => {
      const pos = positions.get(p.id)!;
      const f = forces.get(p.id)!;
      pos.x += f.fx * damping;
      pos.y += f.fy * damping;
    });
  }

  return positions;
}

const NetworkGraph = ({ posts, relationships, selectedCompanies }: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const positions = useMemo(
    () => computeLayout(posts, relationships),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts.map((p) => p.id).join(","), relationships.length]
  );

  // Center the graph on mount
  useEffect(() => {
    if (!containerRef.current || positions.size === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xs = Array.from(positions.values()).map((p) => p.x);
    const ys = Array.from(positions.values()).map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    setPan({ x: rect.width / 2 - cx, y: rect.height / 2 - cy });
  }, [positions]);

  const isDimmed = useCallback(
    (post: Post) => {
      if (selectedCompanies.length === 0) return false;
      return !post.companies?.some((c) => selectedCompanies.includes(c.id));
    },
    [selectedCompanies]
  );

  const isEdgeHighlighted = useCallback(
    (rel: EngineRelationship) => {
      if (!hoveredNode) return false;
      return rel.engine_id === hoveredNode || rel.related_engine_id === hoveredNode;
    },
    [hoveredNode]
  );

  // Mouse handlers for pan
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("a")) return;
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart(pan);
    },
    [pan]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setPan({
        x: panStart.x + (e.clientX - dragStart.x),
        y: panStart.y + (e.clientY - dragStart.y),
      });
    },
    [dragging, dragStart, panStart]
  );

  const onMouseUp = useCallback(() => setDragging(false), []);

  // Wheel zoom
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      setZoom((z) => Math.min(Math.max(z * delta, 0.3), 2.5));
    },
    []
  );

  // Visible relationships
  const visibleRelationships = useMemo(() => {
    const postIds = new Set(posts.map((p) => p.id));
    return relationships.filter(
      (r) => postIds.has(r.engine_id) && postIds.has(r.related_engine_id)
    );
  }, [posts, relationships]);

  const relationshipTypeColor = (type: string) => {
    switch (type) {
      case "evolution": return "hsl(var(--rel-evolution))";
      case "collaboration": return "hsl(var(--rel-collaboration))";
      case "licensing": return "hsl(var(--rel-licensing))";
      case "modification": return "hsl(var(--rel-modification))";
      default: return "hsl(var(--border))";
    }
  };

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-serif text-xl text-muted-foreground italic">No engines found.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing rounded-2xl border border-border/40 gradient-card"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <svg
          className="w-full h-full"
          style={{ overflow: "visible" }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Relationship edges */}
            {visibleRelationships.map((rel) => {
              const from = positions.get(rel.engine_id);
              const to = positions.get(rel.related_engine_id);
              if (!from || !to) return null;
              const highlighted = isEdgeHighlighted(rel);
              const color = relationshipTypeColor(rel.relationship_type);
              return (
                <g key={rel.id}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={color}
                    strokeWidth={highlighted ? 2.5 : 1.2}
                    strokeOpacity={highlighted ? 0.8 : 0.2}
                    strokeDasharray={rel.relationship_type === "licensing" ? "8 4" : undefined}
                    className="transition-all duration-300"
                  />
                  {/* Relationship label at midpoint */}
                  {highlighted && (
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px] font-sans uppercase tracking-widest pointer-events-none"
                    >
                      {rel.relationship_type}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Engine nodes */}
            {posts.map((post) => {
              const pos = positions.get(post.id);
              if (!pos) return null;
              const dimmed = isDimmed(post);
              const hovered = hoveredNode === post.id;
              const primaryColor = post.companies?.[0]?.color ?? "hsl(var(--muted-foreground))";

              return (
                <foreignObject
                  key={post.id}
                  x={pos.x - NODE_RADIUS}
                  y={pos.y - 80}
                  width={NODE_RADIUS * 2}
                  height={160}
                  className="overflow-visible"
                >
                  <Link
                    to={`/engine/${post.slug}`}
                    className="block"
                    onMouseEnter={() => setHoveredNode(post.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <div
                      className={`relative rounded-2xl p-4 transition-all duration-500 border ${
                        hovered
                          ? "shadow-card-hover -translate-y-1 border-accent/30"
                          : "shadow-soft border-border/40"
                      }`}
                      style={{
                        opacity: dimmed ? 0.25 : 1,
                        background: `linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)`,
                      }}
                    >
                      {/* Company color strip */}
                      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full flex overflow-hidden">
                        {post.companies?.map((c) => (
                          <div key={c.id} className="flex-1" style={{ backgroundColor: c.color + "80" }} />
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                        {post.companies?.map((c) => (
                          <span
                            key={c.id}
                            className="text-[9px] font-sans font-semibold tracking-wider uppercase"
                            style={{ color: c.color }}
                          >
                            {c.name}
                          </span>
                        ))}
                        <span className="text-[9px] font-sans text-muted-foreground ml-auto tabular-nums tracking-wider">
                          {post.year}
                        </span>
                      </div>

                      <h3 className="font-serif text-[14px] font-semibold text-foreground leading-tight mb-1">
                        {post.engine_name}
                      </h3>

                      {post.preview_text && (
                        <p className="text-[11px] font-sans text-muted-foreground leading-relaxed line-clamp-2">
                          {post.preview_text}
                        </p>
                      )}

                      {/* Collaboration badge */}
                      {(post.companies?.length ?? 0) > 1 && (
                        <div className="mt-2">
                          <span className="text-[8px] font-sans font-medium tracking-widest uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                            Collaboration
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </foreignObject>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))}
          className="w-8 h-8 rounded-xl bg-card/90 backdrop-blur border border-border/60 flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-border transition-all shadow-soft"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.3))}
          className="w-8 h-8 rounded-xl bg-card/90 backdrop-blur border border-border/60 flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-border transition-all shadow-soft"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            setZoom(1);
            if (containerRef.current && positions.size > 0) {
              const rect = containerRef.current.getBoundingClientRect();
              const xs = Array.from(positions.values()).map((p) => p.x);
              const ys = Array.from(positions.values()).map((p) => p.y);
              const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
              const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
              setPan({ x: rect.width / 2 - cx, y: rect.height / 2 - cy });
            }
          }}
          className="w-8 h-8 rounded-xl bg-card/90 backdrop-blur border border-border/60 flex items-center justify-center text-foreground/60 hover:text-foreground hover:border-border transition-all shadow-soft"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 px-4 py-2.5 rounded-xl bg-card/90 backdrop-blur border border-border/40 shadow-soft">
        <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-muted-foreground">Connections</span>
        {[
          { type: "evolution", label: "Evolution", dash: false },
          { type: "collaboration", label: "Collaboration", dash: false },
          { type: "licensing", label: "Licensing", dash: true },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div
              className="w-5 h-[2px] rounded-full"
              style={{
                backgroundColor: relationshipTypeColor(item.type),
                ...(item.dash ? { backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, hsl(var(--card)) 3px, hsl(var(--card)) 5px)" } : {}),
              }}
            />
            <span className="text-[9px] font-sans text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Pan hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30">
        <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground">
          Drag to pan · Scroll to zoom
        </span>
      </div>
    </div>
  );
};

export default NetworkGraph;
