import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../stores/themeStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
      aria-label="Toggle theme"
    >
      <Sun 
        size={18} 
        className={`absolute transition-all duration-300 ${theme === "dark" ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"}`} 
      />
      <Moon 
        size={18} 
        className={`absolute transition-all duration-300 ${theme === "dark" ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90"}`} 
      />
    </button>
  );
}
