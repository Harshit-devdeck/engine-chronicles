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
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="text-[11px] font-sans font-medium tracking-widest uppercase text-muted-foreground mr-2">
        Filter
      </span>

      <button
        onClick={onClearAll}
        className={`relative px-4 py-2 rounded-full text-[11px] font-sans font-medium tracking-wide transition-all duration-400 border overflow-hidden ${
          isAllSelected
            ? "bg-foreground text-background border-foreground"
            : "bg-transparent text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground/70"
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
            className={`relative px-4 py-2 rounded-full text-[11px] font-sans font-medium tracking-wide transition-all duration-400 border overflow-hidden ${
              isActive
                ? "border-transparent"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground/70"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: company.color + "15",
                    color: company.color,
                    borderColor: company.color + "40",
                  }
                : undefined
            }
          >
            {/* Active indicator dot */}
            {isActive && (
              <motion.span
                layoutId="filter-dot"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: company.color }}
                transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              />
            )}
            <span className={isActive ? "ml-2" : ""}>{company.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CompanyFilter;
