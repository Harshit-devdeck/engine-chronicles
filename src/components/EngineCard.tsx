import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Post } from "@/hooks/use-engine-data";

interface EngineCardProps {
  post: Post;
  dimmed?: boolean;
}

const EngineCard = ({ post, dimmed = false }: EngineCardProps) => {
  const isCollaboration = (post.companies?.length ?? 0) > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: dimmed ? 0.35 : 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      {/* Timeline node dot */}
      <div className="absolute -bottom-[29px] left-1/2 -translate-x-1/2 z-10">
        <div className="w-3 h-3 rounded-full border-2 border-border bg-background shadow-soft" />
      </div>

      <Link
        to={`/engine/${post.slug}`}
        className="group block w-[280px] flex-shrink-0 rounded-[16px] bg-card shadow-soft hover:shadow-elevated transition-all duration-500 overflow-hidden border border-border/40 hover:-translate-y-1.5"
        style={{
          background: `linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.5) 100%)`,
        }}
      >
        {/* Company color accent — thin elegant strip */}
        <div className="h-[3px] w-full flex">
          {post.companies?.map((c) => (
            <div
              key={c.id}
              className="flex-1 h-full"
              style={{ backgroundColor: c.color, opacity: 0.8 }}
            />
          )) ?? <div className="flex-1 h-full bg-muted" />}
        </div>

        <div className="p-5 pb-5">
          {/* Top row: Company + Year */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {post.companies?.map((c) => (
                <span
                  key={c.id}
                  className="text-[11px] font-sans font-semibold tracking-wide uppercase"
                  style={{ color: c.color }}
                >
                  {c.name}
                </span>
              ))}
            </div>
            <span className="text-[11px] font-sans font-medium tracking-widest text-muted-foreground tabular-nums">
              {post.year}
            </span>
          </div>

          {/* Engine name */}
          <h3 className="font-serif text-[17px] font-semibold text-foreground group-hover:text-foreground/90 transition-colors leading-snug mb-2">
            {post.engine_name}
          </h3>

          {/* Collaboration badge */}
          {isCollaboration && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent/30 text-warm-gray">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Joint Development
              </span>
            </div>
          )}

          {/* Preview text */}
          {post.preview_text && (
            <p className="text-[13px] font-sans text-muted-foreground leading-relaxed line-clamp-2 mb-4">
              {post.preview_text}
            </p>
          )}

          {/* Divider */}
          <div className="h-px w-full bg-border/60 mb-3" />

          {/* Read more */}
          <div className="flex items-center text-[11px] font-sans font-medium tracking-wide text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            <span>Read the story</span>
            <svg
              className="ml-1.5 w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EngineCard;
