import { Link } from "react-router-dom";
import { Search } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const Header = ({ searchQuery, onSearchChange }: HeaderProps) => {
  return (
    <header className="border-b border-border/50">
      <div className="max-w-[1600px] mx-auto px-8 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
            <span className="font-serif font-bold text-sm text-primary-foreground">E</span>
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-foreground leading-none">
              Engine Chronicle
            </h1>
            <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
              Automotive Engine Evolution
            </p>
          </div>
        </Link>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search engines..."
            className="w-64 pl-9 pr-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
