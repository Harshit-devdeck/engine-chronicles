import { useParams, Link } from "react-router-dom";
import { usePost, useRelatedEngines } from "@/hooks/use-engine-data";
import { ArrowLeft } from "lucide-react";

const EnginePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = usePost(slug ?? "");
  const { data: relatedEngines = [] } = useRelatedEngines(post?.id ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Engine Not Found</h1>
          <Link to="/" className="text-sm font-sans text-accent hover:underline">
            Return to timeline
          </Link>
        </div>
      </div>
    );
  }

  const specs = post.specs as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <nav className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to timeline
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          {/* Company badges */}
          <div className="flex items-center gap-3 mb-4">
            {post.companies?.map((c) => (
              <span
                key={c.id}
                className="text-xs font-sans font-semibold tracking-wider uppercase px-3 py-1 rounded-full"
                style={{ backgroundColor: c.color + "18", color: c.color }}
              >
                {c.name}
              </span>
            ))}
            <span className="text-xs font-sans text-muted-foreground tracking-wider">{post.year}</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            {post.title}
          </h1>

          <p className="font-sans text-lg text-muted-foreground leading-relaxed">
            {post.preview_text}
          </p>

          {/* Color bar */}
          <div className="flex mt-8 rounded-full overflow-hidden h-1">
            {post.companies?.map((c) => (
              <div key={c.id} className="flex-1" style={{ backgroundColor: c.color }} />
            ))}
          </div>
        </header>

        {/* Image */}
        {post.image_url && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-medium">
            <img
              src={post.image_url}
              alt={post.engine_name}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="mb-16">
          {post.content?.split(/\\n\\n|\n\n/).map((paragraph, i) => (
            <p
              key={i}
              className="font-sans text-base text-foreground/85 leading-[1.85] mb-6"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Specs */}
        {specs && Object.keys(specs).length > 0 && (
          <section className="mb-16">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
              Technical Specifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(specs).map(([key, value]) => (
                <div
                  key={key}
                  className="gradient-card rounded-xl p-4 border border-border/50"
                >
                  <p className="text-[10px] font-sans font-medium tracking-widest uppercase text-muted-foreground mb-1">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="font-sans text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vehicles */}
        {post.vehicles && post.vehicles.length > 0 && (
          <section className="mb-16">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
              Notable Vehicles
            </h2>
            <div className="flex flex-wrap gap-3">
              {post.vehicles.map((v) => (
                <span
                  key={v}
                  className="px-4 py-2 rounded-full bg-secondary text-sm font-sans text-secondary-foreground border border-border/50"
                >
                  {v}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Related engines */}
        {relatedEngines.length > 0 && (
          <section className="mb-16">
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
              Related Engines
            </h2>
            <div className="grid gap-4">
              {relatedEngines.map((engine: any) => (
                <Link
                  key={engine.id}
                  to={`/engine/${engine.slug}`}
                  className="group flex items-center gap-4 p-4 rounded-xl gradient-card border border-border/50 hover:shadow-soft transition-all"
                >
                  <div className="flex-1">
                    <p className="font-serif text-lg font-semibold text-foreground group-hover:text-accent-foreground transition-colors">
                      {engine.engine_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {engine.companies?.map((c: any) => (
                        <span key={c.id} className="text-xs font-sans" style={{ color: c.color }}>
                          {c.name}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground">· {engine.year}</span>
                    </div>
                  </div>
                  <span className="text-xs font-sans tracking-wider uppercase text-muted-foreground px-3 py-1 rounded-full bg-secondary">
                    {engine.relationship_type}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-3xl mx-auto px-8">
          <p className="text-xs font-sans text-muted-foreground">
            © 2026 Engine Chronicle. A curated automotive history publication.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EnginePage;
