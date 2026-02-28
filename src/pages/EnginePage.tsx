import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePost, useRelatedEngines } from "@/hooks/use-engine-data";
import { ArrowLeft, ArrowRight } from "lucide-react";

const EnginePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = usePost(slug ?? "");
  const { data: relatedEngines = [] } = useRelatedEngines(post?.id ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="font-serif text-3xl font-bold text-foreground">Engine Not Found</h1>
        <Link to="/" className="text-sm font-sans text-accent hover:underline">
          Return to the timeline
        </Link>
      </div>
    );
  }

  const specs = post.specs as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-[720px] mx-auto px-8 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[12px] font-sans font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Network
          </Link>
          <div className="flex items-center gap-2">
            {post.companies?.map((c) => (
              <span
                key={c.id}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: c.color }}
              />
            ))}
            <span className="text-[11px] font-sans text-muted-foreground tracking-wider">
              {post.year}
            </span>
          </div>
        </div>
      </nav>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-[720px] mx-auto px-8 py-16"
      >
        {/* Article header */}
        <header className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            {post.companies?.map((c) => (
              <span
                key={c.id}
                className="text-[11px] font-sans font-semibold tracking-[0.15em] uppercase px-3 py-1.5 rounded-xl"
                style={{
                  backgroundColor: c.color + "12",
                  color: c.color,
                  border: `1px solid ${c.color}25`,
                }}
              >
                {c.name}
              </span>
            ))}
            <span className="w-px h-4 bg-border/60" />
            <span className="text-[12px] font-sans text-muted-foreground tracking-wider tabular-nums">
              {post.year}
            </span>
          </div>

          <h1 className="font-serif text-[40px] md:text-[48px] font-bold text-foreground leading-[1.12] mb-5 tracking-tight">
            {post.title}
          </h1>

          <p className="font-sans text-[17px] text-muted-foreground leading-[1.65] max-w-[560px]">
            {post.preview_text}
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-[3px] w-16 rounded-full overflow-hidden">
              {post.companies?.map((c) => (
                <div key={c.id} className="flex-1" style={{ background: `linear-gradient(90deg, ${c.color}80, ${c.color}40)` }} />
              ))}
            </div>
            <span className="text-[11px] font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
              {post.engine_name}
            </span>
          </div>
        </header>

        {/* Hero image */}
        {post.image_url && (
          <div className="mb-14 rounded-2xl overflow-hidden shadow-elevated gradient-border">
            <img
              src={post.image_url}
              alt={post.engine_name}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Article content */}
        <div className="mb-16">
          {post.content?.split(/\\n\\n|\n\n/).map((paragraph, i) => (
            <p
              key={i}
              className="font-sans text-[16px] text-foreground/80 leading-[1.9] mb-7 first-letter:text-[1.1em] first-letter:font-medium"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Technical Specifications */}
        {specs && Object.keys(specs).length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-gradient-to-r from-accent/60 to-transparent" />
              <h2 className="font-serif text-[22px] font-semibold text-foreground tracking-tight">
                Technical Specifications
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(specs).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl p-4 gradient-card gradient-border hover:shadow-soft transition-shadow duration-300"
                >
                  <p className="text-[9px] font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1.5">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="font-sans text-[14px] font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notable Vehicles */}
        {post.vehicles && post.vehicles.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-gradient-to-r from-accent/60 to-transparent" />
              <h2 className="font-serif text-[22px] font-semibold text-foreground tracking-tight">
                Notable Vehicles
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {post.vehicles.map((v) => (
                <span
                  key={v}
                  className="px-4 py-2 rounded-xl bg-secondary/60 text-[13px] font-sans text-secondary-foreground border border-border/30"
                >
                  {v}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Related Engines */}
        {relatedEngines.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-gradient-to-r from-accent/60 to-transparent" />
              <h2 className="font-serif text-[22px] font-semibold text-foreground tracking-tight">
                Related Engines
              </h2>
            </div>
            <div className="grid gap-3">
              {relatedEngines.map((engine: any) => (
                <Link
                  key={engine.id}
                  to={`/engine/${engine.slug}`}
                  className="group flex items-center gap-5 p-5 rounded-xl gradient-card gradient-border hover:shadow-soft transition-all duration-300"
                >
                  <div className="flex flex-col gap-1">
                    {engine.companies?.map((c: any) => (
                      <div key={c.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[16px] font-semibold text-foreground group-hover:text-accent transition-colors leading-tight">
                      {engine.engine_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {engine.companies?.map((c: any) => (
                        <span key={c.id} className="text-[11px] font-sans font-medium" style={{ color: c.color }}>
                          {c.name}
                        </span>
                      ))}
                      <span className="text-[11px] text-muted-foreground">· {engine.year}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-sans tracking-wider uppercase text-muted-foreground px-2.5 py-1 rounded-lg bg-secondary/50 border border-border/30">
                      {engine.relationship_type}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </motion.article>

      <footer className="border-t border-border/30 py-10">
        <div className="max-w-[720px] mx-auto px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[11px] font-sans text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Back to network
          </Link>
          <p className="text-[10px] font-sans text-muted-foreground/50">
            © 2026 Engine Chronicle
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EnginePage;