import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Check local storage or system preference
const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem("dsr-theme") as Theme | null;
  if (stored) return stored;
  
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialTheme = getInitialTheme();
  
  // Apply initial theme to document
  if (initialTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  return {
    theme: initialTheme,
    toggleTheme: () => set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("dsr-theme", newTheme);
      
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      return { theme: newTheme };
    }),
    setTheme: (theme: Theme) => set(() => {
      localStorage.setItem("dsr-theme", theme);
      
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      return { theme };
    }),
  };
});
