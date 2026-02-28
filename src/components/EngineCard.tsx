import { Link } from "react-router-dom";
import type { Post } from "@/hooks/use-engine-data";

interface EngineCardProps {
  post: Post;
}

const EngineCard = ({ post }: EngineCardProps) => {
  const companyColor = post.companies?.[0]?.color ?? "#888";
  const isCollaboration = (post.companies?.length ?? 0) > 1;

  return (
    <Link
      to={`/engine/${post.slug}`}
      className="group block w-72 flex-shrink-0 rounded-2xl gradient-card shadow-soft hover:shadow-elevated transition-all duration-500 overflow-hidden border border-border/50 hover:-translate-y-1"
    >
      {/* Color accent bar */}
      <div className="h-1 w-full flex">
        {post.companies?.map((c, i) => (
          <div
            key={c.id}
            className="flex-1 h-full"
            style={{ backgroundColor: c.color }}
          />
        )) ?? <div className="flex-1 h-full bg-muted" />}
      </div>

      <div className="p-6">
        {/* Year badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-sans font-medium tracking-widest uppercase text-muted-foreground">
            {post.year}
          </span>
          {isCollaboration && (
            <span className="text-[10px] font-sans font-medium tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent/40 text-accent-foreground">
              Collaboration
            </span>
          )}
        </div>

        {/* Engine name */}
        <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-accent-foreground transition-colors mb-1 leading-tight">
          {post.engine_name}
        </h3>

        {/* Companies */}
        <div className="flex items-center gap-2 mb-3">
          {post.companies?.map((c) => (
            <span
              key={c.id}
              className="text-xs font-sans font-medium"
              style={{ color: c.color }}
            >
              {c.name}
            </span>
          ))}
        </div>

        {/* Preview text */}
        {post.preview_text && (
          <p className="text-sm font-sans text-muted-foreground leading-relaxed line-clamp-3">
            {post.preview_text}
          </p>
        )}

        {/* Read more */}
        <div className="mt-4 flex items-center text-xs font-sans font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          <span>Read story</span>
          <svg className="ml-1 w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default EngineCard;
