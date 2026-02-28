import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const Header = ({ searchQuery, onSearchChange }: HeaderProps) => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow duration-500">
            <span className="font-serif font-bold text-sm text-primary-foreground">E</span>
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-foreground leading-none">
              Engine Chronicle
            </h1>
            <p className="text-[9px] font-sans tracking-[0.25em] uppercase text-muted-foreground mt-0.5">
              Automotive Engine Evolution
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-[11px] font-sans font-medium tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors">
            Timeline
          </Link>
          <span className="text-[11px] font-sans font-medium tracking-widest uppercase text-foreground/30 cursor-default">
            Archive
          </span>
          <span className="text-[11px] font-sans font-medium tracking-widest uppercase text-foreground/30 cursor-default">
            About
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${searchFocused ? 'text-foreground' : 'text-muted-foreground'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search engines, companies..."
              className={`w-64 pl-9 pr-4 py-2.5 rounded-xl text-[13px] font-sans text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-300 border ${
                searchFocused
                  ? "bg-card border-border shadow-soft"
                  : "bg-secondary/30 border-transparent hover:bg-secondary/50"
              }`}
            />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;