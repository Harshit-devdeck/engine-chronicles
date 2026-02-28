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

const NODE_RADIUS = 160;
const LINK_DISTANCE = 380;

function computeLayout(
  posts: Post[],
  relationships: EngineRelationship[]
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  if (posts.length === 0) return positions;

  const adj = new Map<string, Set<string>>();
  posts.forEach((p) => adj.set(p.id, new Set()));
  relationships.forEach((r) => {
    adj.get(r.engine_id)?.add(r.related_engine_id);
    adj.get(r.related_engine_id)?.add(r.engine_id);
  });

  const companyGroups = new Map<string, Post[]>();
  posts.forEach((p) => {
    const companyId = p.companies?.[0]?.id ?? "unknown";
    if (!companyGroups.has(companyId)) companyGroups.set(companyId, []);
    companyGroups.get(companyId)!.push(p);
  });

  const groups = Array.from(companyGroups.entries());
  groups.sort((a, b) => a[0].localeCompare(b[0]));
  const centerX = 600;
  const centerY = 450;

  groups.forEach(([, groupPosts], gi) => {
    const angle = (gi / groups.length) * Math.PI * 2 - Math.PI / 2;
    const groupRadius = 300 + groups.length * 45;
    const gx = centerX + Math.cos(angle) * groupRadius;
    const gy = centerY + Math.sin(angle) * groupRadius;

    const sorted = [...groupPosts].sort((a, b) => a.year - b.year || a.engine_name.localeCompare(b.engine_name));
    sorted.forEach((p, i) => {
      const spread = sorted.length > 1 ? (i / (sorted.length - 1) - 0.5) * 280 : 0;
      const perpAngle = angle + Math.PI / 2;
      const offsetX = ((i % 3) - 1) * 15;
      const offsetY = (Math.floor(i / 3) % 2 === 0 ? 1 : -1) * 10;
      positions.set(p.id, {
        x: gx + Math.cos(perpAngle) * spread + offsetX,
        y: gy + Math.sin(perpAngle) * spread + offsetY,
      });
    });
  });

  for (let iter = 0; iter < 80; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    posts.forEach((p) => forces.set(p.id, { fx: 0, fy: 0 }));

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

    posts.forEach((p) => {
      const pos = positions.get(p.id)!;
      forces.get(p.id)!.fx += (centerX - pos.x) * 0.002;
      forces.get(p.id)!.fy += (centerY - pos.y) * 0.002;
    });

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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [didDrag, setDidDrag] = useState(false);

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

  // Connected nodes for highlighting
  const connectedNodes = useMemo(() => {
    const active = selectedNode || hoveredNode;
    if (!active) return new Set<string>();
    const connected = new Set<string>();
    relationships.forEach((r) => {
      if (r.engine_id === active) connected.add(r.related_engine_id);
      if (r.related_engine_id === active) connected.add(r.engine_id);
    });
    return connected;
  }, [selectedNode, hoveredNode, relationships]);

  const activeNode = selectedNode || hoveredNode;

  const isDimmed = useCallback(
    (post: Post) => {
      if (selectedCompanies.length === 0 && !activeNode) return false;
      if (activeNode) {
        return post.id !== activeNode && !connectedNodes.has(post.id);
      }
      return !post.companies?.some((c) => selectedCompanies.includes(c.id));
    },
    [selectedCompanies, activeNode, connectedNodes]
  );

  const isEdgeHighlighted = useCallback(
    (rel: EngineRelationship) => {
      if (!activeNode) return false;
      return rel.engine_id === activeNode || rel.related_engine_id === activeNode;
    },
    [activeNode]
  );

  const isEdgeDimmed = useCallback(
    (rel: EngineRelationship) => {
      if (!activeNode) return false;
      return rel.engine_id !== activeNode && rel.related_engine_id !== activeNode;
    },
    [activeNode]
  );

  // Mouse handlers for pan
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("a")) return;
      setDragging(true);
      setDidDrag(false);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart(pan);
    },
    [pan]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setDidDrag(true);
      setPan({
        x: panStart.x + dx,
        y: panStart.y + dy,
      });
    },
    [dragging, dragStart, panStart]
  );

  const onMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Click on background to deselect
  const onBackgroundClick = useCallback(() => {
    if (!didDrag) setSelectedNode(null);
  }, [didDrag]);

  // Touch support
  const touchRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchRef.current = { startX: t.clientX, startY: t.clientY, panX: pan.x, panY: pan.y };
      setDidDrag(false);
    }
  }, [pan]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchRef.current) {
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.startX;
      const dy = t.clientY - touchRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setDidDrag(true);
      setPan({ x: touchRef.current.panX + dx, y: touchRef.current.panY + dy });
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    touchRef.current = null;
  }, []);

  // Wheel zoom with pointer centering
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.min(Math.max(zoom * delta, 0.3), 2.5);
      
      // Zoom toward pointer
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const scale = newZoom / zoom;
        setPan({
          x: mx - (mx - pan.x) * scale,
          y: my - (my - pan.y) * scale,
        });
      }
      setZoom(newZoom);
    },
    [zoom, pan]
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

  // Selected post details
  const selectedPost = useMemo(
    () => (selectedNode ? posts.find((p) => p.id === selectedNode) : null),
    [selectedNode, posts]
  );

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return visibleRelationships
      .filter((r) => r.engine_id === selectedNode || r.related_engine_id === selectedNode)
      .map((r) => {
        const otherId = r.engine_id === selectedNode ? r.related_engine_id : r.engine_id;
        const otherPost = posts.find((p) => p.id === otherId);
        return { ...r, otherPost };
      })
      .filter((r) => r.otherPost);
  }, [selectedNode, visibleRelationships, posts]);

  // Double-click to focus on a node
  const onNodeDoubleClick = useCallback((postId: string) => {
    const pos = positions.get(postId);
    if (!pos || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const targetZoom = 1.4;
    setPan({ x: rect.width / 2 - pos.x * targetZoom, y: rect.height / 2 - pos.y * targetZoom });
    setZoom(targetZoom);
  }, [positions]);

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-serif text-xl text-muted-foreground italic">No engines found.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 120px)", minHeight: 650 }}>
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing rounded-2xl border border-border/40 gradient-card"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onBackgroundClick}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <svg
          className="w-full h-full"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Glow filter for active nodes */}
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Animated dash for highlighted edges */}
            <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            style={{ transition: dragging ? "none" : "transform 0.15s ease-out" }}
          >
            {/* Relationship edges */}
            {visibleRelationships.map((rel) => {
              const from = positions.get(rel.engine_id);
              const to = positions.get(rel.related_engine_id);
              if (!from || !to) return null;
              const highlighted = isEdgeHighlighted(rel);
              const dimmed = isEdgeDimmed(rel);
              const color = relationshipTypeColor(rel.relationship_type);

              // Curved path for better aesthetics
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const curvature = Math.min(dist * 0.15, 40);
              const nx = -dy / dist * curvature;
              const ny = dx / dist * curvature;

              return (
                <g key={rel.id}>
                  {/* Glow under highlighted edge */}
                  {highlighted && (
                    <path
                      d={`M${from.x},${from.y} Q${mx + nx},${my + ny} ${to.x},${to.y}`}
                      stroke={color}
                      strokeWidth={6}
                      strokeOpacity={0.15}
                      fill="none"
                      filter="url(#edge-glow)"
                    />
                  )}
                  <path
                    d={`M${from.x},${from.y} Q${mx + nx},${my + ny} ${to.x},${to.y}`}
                    stroke={color}
                    strokeWidth={highlighted ? 2.5 : 1.2}
                    strokeOpacity={dimmed ? 0.06 : highlighted ? 0.85 : 0.2}
                    strokeDasharray={rel.relationship_type === "licensing" ? "8 4" : undefined}
                    fill="none"
                    className="transition-all duration-500"
                  >
                    {highlighted && (
                      <animate
                        attributeName="stroke-dashoffset"
                        values="0;-24"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                  {/* Animated dots along highlighted edges */}
                  {highlighted && (
                    <circle r="3" fill={color} opacity={0.7}>
                      <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={`M${from.x},${from.y} Q${mx + nx},${my + ny} ${to.x},${to.y}`}
                      />
                    </circle>
                  )}
                  {/* Relationship label at midpoint */}
                  {highlighted && (
                    <text
                      x={mx + nx * 0.8}
                      y={my + ny * 0.8 - 10}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px] font-sans uppercase tracking-widest pointer-events-none"
                      style={{ opacity: 0.8 }}
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
              const isActive = activeNode === post.id;
              const isConnected = connectedNodes.has(post.id);
              const isSelected = selectedNode === post.id;
              const primaryColor = post.companies?.[0]?.color ?? "hsl(var(--muted-foreground))";

              return (
                <g key={post.id}>
                  {/* Pulse ring behind selected/hovered node */}
                  {isActive && (
                    <>
                      <ellipse
                        cx={pos.x}
                        cy={pos.y}
                        rx={NODE_RADIUS + 10}
                        ry={90}
                        fill="none"
                        stroke={primaryColor}
                        strokeWidth={1.5}
                        opacity={0.3}
                      >
                        <animate
                          attributeName="rx"
                          values={`${NODE_RADIUS + 5};${NODE_RADIUS + 25};${NODE_RADIUS + 5}`}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="ry"
                          values="85;100;85"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.3;0.08;0.3"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </ellipse>
                    </>
                  )}

                  {/* Connection indicator dots for connected nodes */}
                  {activeNode && isConnected && !isActive && (
                    <circle
                      cx={pos.x}
                      cy={pos.y - 88}
                      r={4}
                      fill={primaryColor}
                      opacity={0.8}
                    >
                      <animate
                        attributeName="opacity"
                        values="0.8;0.3;0.8"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  <foreignObject
                    x={pos.x - NODE_RADIUS}
                    y={pos.y - 90}
                    width={NODE_RADIUS * 2}
                    height={180}
                    className="overflow-visible"
                  >
                    <div
                      className="block cursor-pointer"
                      onMouseEnter={() => setHoveredNode(post.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!didDrag) {
                          setSelectedNode((prev) => (prev === post.id ? null : post.id));
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        onNodeDoubleClick(post.id);
                      }}
                    >
                      <div
                        className={`relative rounded-2xl p-4 transition-all duration-500 border select-none ${
                          isSelected
                            ? "shadow-card-hover -translate-y-1.5 border-accent/50 ring-2 ring-accent/20"
                            : isActive
                            ? "shadow-card-hover -translate-y-1 border-accent/30"
                            : isConnected && activeNode
                            ? "shadow-medium border-accent/20"
                            : "shadow-soft border-border/40"
                        }`}
                        style={{
                          opacity: dimmed ? 0.15 : 1,
                          background: isSelected
                            ? `linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--accent) / 0.06) 100%)`
                            : `linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)`,
                          transform: isActive ? "scale(1.03)" : isConnected && activeNode ? "scale(1.01)" : "scale(1)",
                          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {/* Company color strip */}
                        <div className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full flex overflow-hidden">
                          {post.companies?.map((c) => (
                            <div
                              key={c.id}
                              className="flex-1 transition-all duration-500"
                              style={{
                                backgroundColor: isActive ? c.color : c.color + "80",
                                height: isActive ? "3px" : "2px",
                              }}
                            />
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

                        <h3 className="font-serif text-[15px] font-semibold text-foreground leading-tight mb-1.5">
                          {post.engine_name}
                        </h3>

                        {post.preview_text && (
                          <p className="text-[12px] font-sans text-muted-foreground leading-relaxed line-clamp-2">
                            {post.preview_text}
                          </p>
                        )}

                        {(post.companies?.length ?? 0) > 1 && (
                          <div className="mt-2">
                            <span className="text-[8px] font-sans font-medium tracking-widest uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                              Collaboration
                            </span>
                          </div>
                        )}

                        {/* "View details" hint on selected */}
                        {isSelected && (
                          <Link
                            to={`/engine/${post.slug}`}
                            className="mt-2.5 flex items-center gap-1 text-[10px] font-sans font-medium text-accent hover:text-accent/80 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>View full details</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Selected node detail panel */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-4 right-14 w-64 rounded-2xl bg-card/95 backdrop-blur-lg border border-border/60 shadow-elevated p-4 z-10"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  {selectedPost.companies?.map((c) => (
                    <span
                      key={c.id}
                      className="text-[9px] font-sans font-semibold tracking-wider uppercase"
                      style={{ color: c.color }}
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground leading-tight">
                  {selectedPost.engine_name}
                </h3>
                <p className="text-[11px] font-sans text-muted-foreground tabular-nums">{selectedPost.year}</p>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedPost.preview_text && (
              <p className="text-[11px] font-sans text-muted-foreground leading-relaxed mb-3">
                {selectedPost.preview_text}
              </p>
            )}

            {/* Connections list */}
            {selectedConnections.length > 0 && (
              <div className="border-t border-border/40 pt-3">
                <p className="text-[9px] font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">
                  Connections ({selectedConnections.length})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
                  {selectedConnections.map((conn) => (
                    <button
                      key={conn.id}
                      onClick={() => {
                        setSelectedNode(conn.otherPost!.id);
                        onNodeDoubleClick(conn.otherPost!.id);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-all text-left group"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: relationshipTypeColor(conn.relationship_type) }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-sans font-medium text-foreground truncate group-hover:text-accent transition-colors">
                          {conn.otherPost!.engine_name}
                        </p>
                        <p className="text-[9px] font-sans text-muted-foreground capitalize">
                          {conn.relationship_type}
                        </p>
                      </div>
                      <svg className="w-3 h-3 text-muted-foreground/40 group-hover:text-accent/60 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Link
              to={`/engine/${selectedPost.slug}`}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent text-[11px] font-sans font-medium hover:bg-accent/20 transition-all border border-accent/20"
            >
              Open Engine Page
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

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
            setSelectedNode(null);
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
          Click to select · Double-click to focus · Drag to pan · Scroll to zoom
        </span>
      </div>
    </div>
  );
};

export default NetworkGraph;
