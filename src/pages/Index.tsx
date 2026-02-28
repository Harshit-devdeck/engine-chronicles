import { useState, useMemo } from "react";
import { usePosts, useCompanies, useEngineRelationships } from "@/hooks/use-engine-data";
import Header from "@/components/Header";
import CompanyFilter from "@/components/CompanyFilter";
import Timeline from "@/components/Timeline";

const Index = () => {
  const { data: posts = [], isLoading: postsLoading } = usePosts();
  const { data: companies = [] } = useCompanies();
  const { data: relationships = [] } = useEngineRelationships();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.engine_name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.companies?.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [posts, searchQuery]);

  const toggleCompany = (id: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="max-w-[1600px] mx-auto">
        {/* Hero section */}
        <section className="px-8 pt-16 pb-8">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight max-w-2xl">
            The Evolution of
            <br />
            <span className="text-accent">Automotive Engines</span>
          </h2>
          <p className="mt-4 font-sans text-base text-muted-foreground max-w-lg leading-relaxed">
            A curated journey through the most significant powerplants in automotive history—from pioneering innovations to modern masterpieces.
          </p>
        </section>

        {/* Company filter */}
        <section className="px-8 pb-8">
          <CompanyFilter
            companies={companies}
            selected={selectedCompanies}
            onToggle={toggleCompany}
            onClearAll={() => setSelectedCompanies([])}
          />
        </section>

        {/* Timeline */}
        <section className="pb-16">
          {postsLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          ) : (
            <Timeline
              posts={filteredBySearch}
              relationships={relationships}
              selectedCompanies={selectedCompanies}
            />
          )}
        </section>

        {/* Stats */}
        <section className="px-8 pb-16">
          <div className="grid grid-cols-3 gap-8 max-w-xl">
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">{posts.length}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1 tracking-wide uppercase">Engines</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">{companies.length}</p>
              <p className="text-xs font-sans text-muted-foreground mt-1 tracking-wide uppercase">Companies</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">
                {posts.length > 0 ? `${Math.min(...posts.map((p) => p.year))}–${Math.max(...posts.map((p) => p.year))}` : "—"}
              </p>
              <p className="text-xs font-sans text-muted-foreground mt-1 tracking-wide uppercase">Years Covered</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between">
          <p className="text-xs font-sans text-muted-foreground">
            © 2026 Engine Chronicle. A curated automotive history publication.
          </p>
          <p className="text-xs font-sans text-muted-foreground">
            Built with precision & passion.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
