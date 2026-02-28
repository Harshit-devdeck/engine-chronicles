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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: dimmed ? 0.3 : 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      {/* Timeline node — precision styled */}
      <div className="absolute -bottom-[30px] left-1/2 -translate-x-1/2 z-10">
        <div className={`w-3.5 h-3.5 rounded-full ${dimmed ? 'node-ring' : 'node-ring-active'} transition-all duration-500`}>
          <div
            className="w-full h-full rounded-full"
            style={{
              background: post.companies?.[0]?.color
                ? `linear-gradient(135deg, ${post.companies[0].color}90, ${post.companies[0].color}50)`
                : undefined,
            }}
          />
        </div>
      </div>

      <Link
        to={`/engine/${post.slug}`}
        className="group block w-[290px] flex-shrink-0 rounded-2xl gradient-border overflow-hidden hover:-translate-y-2 transition-all duration-500 shadow-soft hover:shadow-card-hover"
      >
        {/* Card inner with gradient */}
        <div className="gradient-card rounded-2xl">
          {/* Company color accent — refined strip */}
          <div className="h-[3px] w-full flex">
            {post.companies?.map((c) => (
              <div
                key={c.id}
                className="flex-1 h-full"
                style={{ background: `linear-gradient(90deg, ${c.color}90, ${c.color}60)` }}
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
            <h3 className="font-serif text-[17px] font-semibold text-foreground group-hover:text-accent transition-colors duration-300 leading-snug mb-2">
              {post.engine_name}
            </h3>

            {/* Collaboration badge */}
            {isCollaboration && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium tracking-wider uppercase px-2.5 py-1 rounded-full bg-accent/20 text-warm-gray border border-accent/20">
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
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-3" />

            {/* Read more */}
            <div className="flex items-center text-[11px] font-sans font-medium tracking-wide text-muted-foreground group-hover:text-accent transition-colors duration-300">
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
        </div>
      </Link>
    </motion.div>
  );
};

export default EngineCard;