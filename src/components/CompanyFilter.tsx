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
      <button
        onClick={onClearAll}
        className={`px-4 py-2 rounded-full text-xs font-sans font-medium tracking-wide transition-all duration-300 border ${
          isAllSelected
            ? "bg-primary text-primary-foreground border-primary shadow-soft"
            : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
        }`}
      >
        All Engines
      </button>
      {companies.map((company) => {
        const isActive = selected.includes(company.id);
        return (
          <button
            key={company.id}
            onClick={() => onToggle(company.id)}
            className={`px-4 py-2 rounded-full text-xs font-sans font-medium tracking-wide transition-all duration-300 border ${
              isActive
                ? "text-primary-foreground shadow-soft"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
            }`}
            style={
              isActive
                ? { backgroundColor: company.color, borderColor: company.color }
                : undefined
            }
          >
            {company.name}
          </button>
        );
      })}
    </div>
  );
};

export default CompanyFilter;
