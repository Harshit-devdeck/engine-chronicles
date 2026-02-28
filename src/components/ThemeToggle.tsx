import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-9 h-9 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-300"
      aria-label="Toggle theme"
    >
      <Sun className="w-4 h-4 absolute transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="w-4 h-4 absolute transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </button>
  );
};

export default ThemeToggle;