import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { usePosts, useCompanies, useEngineRelationships } from "@/hooks/use-engine-data";
import Header from "@/components/Header";
import CompanyFilter from "@/components/CompanyFilter";
import Timeline from "@/components/Timeline";
import NetworkGraph from "@/components/NetworkGraph";
import EngineComparison from "@/components/EngineComparison";

type ViewTab = "timeline" | "network" | "compare";

const Index = () => {
  const { data: posts = [], isLoading: postsLoading } = usePosts();
  const { data: companies = [] } = useCompanies();
  const { data: relationships = [] } = useEngineRelationships();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("timeline");

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

  const tabs: { key: ViewTab; label: string; description: string }[] = [
    { key: "timeline", label: "Timeline", description: "Chronological" },
    { key: "network", label: "Network", description: "Connections" },
    { key: "compare", label: "Compare", description: "Side by side" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main>
        {/* Hero section */}
        <section className="relative max-w-[1600px] mx-auto px-8 pt-20 pb-12">
          <div className="absolute inset-0 gradient-hero pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative max-w-2xl"
          >
            <p className="text-[11px] font-sans font-medium tracking-[0.3em] uppercase text-accent mb-5">
              Automotive Heritage Journal
            </p>
            <h2 className="font-serif text-[52px] md:text-[64px] font-bold text-foreground leading-[1.06] tracking-tight">
              The Engine
              <br />
              <span className="bg-gradient-to-r from-accent via-accent/70 to-steel bg-clip-text text-transparent">
                Chronicle
              </span>
            </h2>
            <p className="mt-6 font-sans text-[16px] text-muted-foreground leading-[1.75] max-w-lg">
              A curated exploration of automotive engine evolution — tracing collaborations, 
              innovations, and the lineage that connects the world's great manufacturers.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-[2px] w-20 rounded-full overflow-hidden">
                <div className="flex-1 bg-accent/50" />
                <div className="flex-1 bg-steel/30" />
                <div className="flex-1 bg-gold/30" />
              </div>
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-muted-foreground/60">
                Est. 2026
              </span>
            </div>
          </motion.div>
        </section>

        {/* View tabs */}
        <section className="max-w-[1600px] mx-auto px-8 pb-6">
          <div className="flex items-center gap-6">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/40 border border-border/30">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-5 py-2.5 rounded-lg text-[12px] font-sans font-medium tracking-wide transition-all duration-300 ${
                    activeTab === tab.key
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.key && (
                    <span className="block text-[9px] text-muted-foreground tracking-wider mt-0.5">
                      {tab.description}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border/40" />

            {/* Company filter — only for timeline & network */}
            {activeTab !== "compare" && (
              <CompanyFilter
                companies={companies}
                selected={selectedCompanies}
                onToggle={toggleCompany}
                onClearAll={() => setSelectedCompanies([])}
              />
            )}
          </div>
        </section>

        {/* Content area */}
        {postsLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <p className="text-[11px] font-sans tracking-[0.2em] uppercase text-muted-foreground">
                Loading chronicle...
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "timeline" && (
              <section className="max-w-[1600px] mx-auto px-8 pb-16">
                <Timeline
                  posts={filteredBySearch}
                  relationships={relationships}
                  selectedCompanies={selectedCompanies}
                />
              </section>
            )}

            {activeTab === "network" && (
              <section className="max-w-[1600px] mx-auto px-8 pb-16">
                <NetworkGraph
                  posts={filteredBySearch}
                  relationships={relationships}
                  selectedCompanies={selectedCompanies}
                />
              </section>
            )}

            {activeTab === "compare" && (
              <section className="max-w-[1200px] mx-auto px-8 pb-16 pt-2">
                <EngineComparison posts={posts} />
              </section>
            )}
          </>
        )}

        {/* Stats section */}
        <section className="max-w-[1600px] mx-auto px-8 pb-20">
          <div className="border-t border-border/30 pt-14">
            <div className="grid grid-cols-3 gap-16 max-w-lg">
              {[
                { value: posts.length, label: "Engines Documented" },
                { value: companies.length, label: "Manufacturers" },
                { value: relationships.length, label: "Connections Mapped" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <p className="font-serif text-[42px] font-bold text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-sans text-muted-foreground mt-2 tracking-[0.2em] uppercase">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-12">
        <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center shadow-soft">
              <span className="font-serif font-bold text-[10px] text-primary-foreground">E</span>
            </div>
            <div>
              <p className="text-[11px] font-sans font-medium text-foreground/70">
                Engine Chronicle
              </p>
              <p className="text-[9px] font-sans text-muted-foreground/50">
                © 2026 · A curated automotive heritage journal
              </p>
            </div>
          </div>
          <p className="text-[10px] font-sans text-muted-foreground/40 italic">
            Crafted with precision & passion
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
