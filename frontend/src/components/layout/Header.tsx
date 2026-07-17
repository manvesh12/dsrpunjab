import { Bell, Menu, Search, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../security/auth.context";
import ThemeToggle from "../ui/ThemeToggle";

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
      >
        <Menu size={22} />
      </button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />

        <input
          type="search"
          placeholder="Search projects, districts and reports..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800 transition-colors"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell size={21} />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 transition-colors">
            <User size={18} />
          </span>

          <span className="hidden text-left sm:block">
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              {user?.name || "User"}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {user?.role ? user.role.replace(/_/g, " ") : "Guest"}
            </span>
          </span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1 dark:bg-slate-700 transition-colors"></div>

        <button
          type="button"
          onClick={handleLogout}
          className="relative rounded-xl p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          title="Logout"
        >
          <LogOut size={21} />
        </button>
      </div>
    </header>
  );
}