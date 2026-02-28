import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { usePosts, useCompanies, useEngineRelationships } from "@/hooks/use-engine-data";
import Header from "@/components/Header";
import CompanyFilter from "@/components/CompanyFilter";
import NetworkGraph from "@/components/NetworkGraph";
import EngineComparison from "@/components/EngineComparison";
import HeroAsciiOne from "@/components/ui/hero-ascii-one";

const Index = () => {
  const { data: posts = [], isLoading: postsLoading } = usePosts();
  const { data: companies = [] } = useCompanies();
  const { data: relationships = [] } = useEngineRelationships();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"network" | "compare">("network");

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
    <div className="relative min-h-screen bg-background">
      {/* 3D Asset Background - Right side */}
      <div className="absolute top-0 right-0 w-1/2 h-[700px] z-0 opacity-40 pointer-events-none">
        <HeroAsciiOne />
      </div>

      <div className="relative z-10">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main>
          {/* Hero section */}
          <section className="relative max-w-[1600px] mx-auto px-8 pt-20 pb-12">
            <div className="absolute inset-0 gradient-hero pointer-events-none" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <p className="text-[11px] font-sans font-semibold tracking-[0.3em] uppercase text-accent mb-5">
                Interactive Knowledge Platform
              </p>
              <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.08] max-w-3xl">
                Engine Lineage
                <br />
                <span className="bg-gradient-to-r from-accent to-accent/50 bg-clip-text text-transparent">
                  Explorer
                </span>
              </h2>
              <p className="mt-6 font-sans text-[15px] md:text-base text-muted-foreground max-w-2xl leading-[1.75]">
                Explore the interconnected evolution of automotive engines—collaborations, modifications, and licensing across manufacturers.
              </p>
            </motion.div>
          </section>

          {/* Tab switcher */}
          <section className="max-w-[1600px] mx-auto px-8 pb-5">
            <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/60 border border-border/30 w-fit">
              {[
                { key: "network" as const, label: "Network Graph" },
                { key: "compare" as const, label: "Compare Engines" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-2.5 rounded-full text-[12px] font-sans font-medium tracking-wide transition-all duration-300 ${
                    activeTab === tab.key
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === "network" && (
            <>
              {/* Company filter */}
              <section className="max-w-[1600px] mx-auto px-8 pb-6">
                <CompanyFilter
                  companies={companies}
                  selected={selectedCompanies}
                  onToggle={toggleCompany}
                  onClearAll={() => setSelectedCompanies([])}
                />
              </section>

              {/* Network Graph */}
              <section className="max-w-[1600px] mx-auto px-8 pb-16">
                {postsLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <NetworkGraph
                    posts={filteredBySearch}
                    relationships={relationships}
                    selectedCompanies={selectedCompanies}
                  />
                )}
              </section>
            </>
          )}

          {activeTab === "compare" && (
            <section className="max-w-[1200px] mx-auto px-8 pb-16 pt-4">
              <EngineComparison posts={posts} />
            </section>
          )}

          {/* Stats section */}
          <section className="max-w-[1600px] mx-auto px-8 pb-20">
            <div className="border-t border-border/40 pt-12">
              <div className="grid grid-cols-3 gap-12 max-w-lg">
                {[
                  { value: posts.length, label: "Engines Documented" },
                  { value: companies.length, label: "Manufacturers" },
                  { value: relationships.length, label: "Connections Mapped" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <p className="font-serif text-4xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] font-sans text-muted-foreground mt-1.5 tracking-[0.2em] uppercase">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
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
            <p className="text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground/40">
              Click to Select · Double-Click to Focus · Drag to Pan
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
