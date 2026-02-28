import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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

      <main>
        {/* Hero section */}
        <section className="max-w-[1600px] mx-auto px-8 pt-20 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="text-[11px] font-sans font-medium tracking-[0.3em] uppercase text-accent mb-4">
              A Curated Automotive History
            </p>
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-[1.1] max-w-2xl">
              The Evolution of
              <br />
              <span className="bg-gradient-to-r from-foreground/80 to-foreground/40 bg-clip-text text-transparent">
                Automotive Engines
              </span>
            </h2>
            <p className="mt-5 font-sans text-[15px] text-muted-foreground max-w-md leading-[1.7]">
              A curated journey through the most significant powerplants in automotive history—from pioneering innovations to modern masterpieces.
            </p>
          </motion.div>
        </section>

        {/* Company filter */}
        <section className="max-w-[1600px] mx-auto px-8 pb-10">
          <CompanyFilter
            companies={companies}
            selected={selectedCompanies}
            onToggle={toggleCompany}
            onClearAll={() => setSelectedCompanies([])}
          />
        </section>

        {/* Timeline */}
        <section className="pb-20">
          {postsLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          ) : (
            <Timeline
              posts={filteredBySearch}
              relationships={relationships}
              selectedCompanies={selectedCompanies}
            />
          )}
        </section>

        {/* Stats section */}
        <section className="max-w-[1600px] mx-auto px-8 pb-20">
          <div className="border-t border-border/40 pt-12">
            <div className="grid grid-cols-3 gap-12 max-w-lg">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0 }}
                viewport={{ once: true }}
              >
                <p className="font-serif text-4xl font-bold text-foreground">{posts.length}</p>
                <p className="text-[10px] font-sans text-muted-foreground mt-1.5 tracking-[0.2em] uppercase">
                  Engines Documented
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
              >
                <p className="font-serif text-4xl font-bold text-foreground">{companies.length}</p>
                <p className="text-[10px] font-sans text-muted-foreground mt-1.5 tracking-[0.2em] uppercase">
                  Manufacturers
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <p className="font-serif text-4xl font-bold text-foreground">
                  {posts.length > 0
                    ? `${Math.max(...posts.map((p) => p.year)) - Math.min(...posts.map((p) => p.year))}`
                    : "—"}
                </p>
                <p className="text-[10px] font-sans text-muted-foreground mt-1.5 tracking-[0.2em] uppercase">
                  Years of History
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10">
        <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg gradient-gold flex items-center justify-center">
              <span className="font-serif font-bold text-[9px] text-primary-foreground">E</span>
            </div>
            <p className="text-[11px] font-sans text-muted-foreground">
              © 2026 Engine Chronicle
            </p>
          </div>
          <p className="text-[11px] font-sans text-muted-foreground/50 italic">
            Crafted with precision & passion
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
