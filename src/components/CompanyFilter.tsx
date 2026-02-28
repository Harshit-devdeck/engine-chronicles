import { motion } from "framer-motion";
import type { Company } from "@/hooks/use-engine-data";

interface CompanyFilterProps {
  companies: Company[];
  selected: string[];
  onToggle: (id: string) => void;
  onClearAll: () => void;
}

const CompanyFilter = ({ companies, selected, onToggle, onClearAll }: CompanyFilterProps) => {
  const isAllSelected = selected.length === 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[10px] font-sans font-medium tracking-[0.3em] uppercase text-muted-foreground mr-1">
        Filter
      </span>

      <button
        onClick={onClearAll}
        className={`relative px-4 py-2 rounded-xl text-[11px] font-sans font-medium tracking-wide transition-all duration-400 border ${
          isAllSelected
            ? "bg-foreground text-background border-foreground shadow-soft"
            : "bg-transparent text-muted-foreground border-border/60 hover:border-foreground/20 hover:text-foreground/70"
        }`}
      >
        All Engines
      </button>

      {companies.map((company) => {
        const isActive = selected.includes(company.id);
        return (
          <motion.button
            key={company.id}
            onClick={() => onToggle(company.id)}
            whileTap={{ scale: 0.97 }}
            className={`relative px-4 py-2 rounded-xl text-[11px] font-sans font-medium tracking-wide transition-all duration-400 border ${
              isActive
                ? "border-transparent shadow-soft"
                : "bg-transparent text-muted-foreground border-border/60 hover:border-foreground/20 hover:text-foreground/70"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: company.color + "12",
                    color: company.color,
                    borderColor: company.color + "30",
                  }
                : undefined
            }
          >
            {/* Active indicator dot */}
            {isActive && (
              <motion.span
                layoutId="filter-dot"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: company.color }}
                transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              />
            )}
            <span className={isActive ? "ml-2.5" : ""}>{company.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CompanyFilter;