import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Copy,
  Eye,
  KeyRound,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type AuthorityRole =
  | "DISTRICT_ADMIN"
  | "DISTRICT_OFFICER"
  | "GEOLOGIST"
  | "SURVEY_OFFICER"
  | "REVIEWER"
  | "DATA_ENTRY_OPERATOR"
  | "REPORT_GENERATOR";

interface AuthorityRoleOption {
  value: AuthorityRole;
  label: string;
}

const AUTHORITY_ROLES: AuthorityRoleOption[] = [
  { value: "DISTRICT_ADMIN", label: "District Administrator" },
  { value: "DISTRICT_OFFICER", label: "District Officer" },
  { value: "GEOLOGIST", label: "Geologist" },
  { value: "SURVEY_OFFICER", label: "Survey Officer" },
  { value: "REVIEWER", label: "Government Reviewer" },
  { value: "DATA_ENTRY_OPERATOR", label: "Data Entry Operator" },
  { value: "REPORT_GENERATOR", label: "Report Generator" },
];

const DISTRICT_ACCOUNT_PREFIX: Record<AuthorityRole, string[]> = {
  DISTRICT_ADMIN: ["admin"],
  DISTRICT_OFFICER: ["officer1", "officer2"],
  GEOLOGIST: ["geologist"],
  SURVEY_OFFICER: ["surveyor"],
  REVIEWER: ["reviewer"],
  DATA_ENTRY_OPERATOR: ["deo1", "deo2"],
  REPORT_GENERATOR: ["reportgen"],
};

const DEMO_AUTHORITY_PASSWORD = "Gov@2026!Secure";

function getAuthorityIds(role: AuthorityRole): string[] {
  return DISTRICT_ACCOUNT_PREFIX[role].map((prefix) => `${prefix}.rpr`);
}

interface GovernmentAuthorityLoginFormProps {
  isLoading: boolean;
  error: string | null;
  onSubmit: (officialId: string, credential: string) => void | Promise<void>;
  onInputChange?: () => void;
}

export default function GovernmentAuthorityLoginForm({
  isLoading,
  error,
  onSubmit,
  onInputChange,
}: GovernmentAuthorityLoginFormProps) {
  const [role, setRole] = useState<AuthorityRole>("DISTRICT_ADMIN");
  const [officialId, setOfficialId] = useState("admin.rpr");
  const [credential, setCredential] = useState("");
  const [showCredential, setShowCredential] = useState(false);
  const [copied, setCopied] = useState<"id" | "password" | null>(null);

  const authorityIds = useMemo(() => getAuthorityIds(role), [role]);

  const notifyChange = () => onInputChange?.();

  const changeRole = (nextRole: AuthorityRole) => {
    setRole(nextRole);
    setOfficialId(getAuthorityIds(nextRole)[0]);
    notifyChange();
  };

  const loadDemoCredentials = (id = authorityIds[0]) => {
    setOfficialId(id);
    setCredential(DEMO_AUTHORITY_PASSWORD);
    notifyChange();
    toast.success(`Demo credentials loaded for ${id}`);
  };

  const copyValue = async (value: string, type: "id" | "password") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Could not copy automatically. Please copy the value manually.");
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void onSubmit(officialId.trim(), credential);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Govt. Authority Portal</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
          Select your authority profile and sign in with official credentials
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
          <BadgeCheck size={15} /> Authority identification
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Authority category</span>
            <span className="relative block">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <select
                value={role}
                onChange={(event) => changeRole(event.target.value as AuthorityRole)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {AUTHORITY_ROLES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </span>
          </label>

          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Jurisdiction</span>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 dark:border-emerald-900 dark:bg-slate-950 dark:text-white">
              <MapPin className="text-emerald-600" size={17} />
              Rupnagar District, Punjab
              <span className="ml-auto rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">RPR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="authority-official-id" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Official Authority ID / NIC ID</label>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{authorityIds.length} demo ID{authorityIds.length > 1 ? "s" : ""}</span>
          </div>
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              id="authority-official-id"
              type="text"
              required
              value={officialId}
              onChange={(event) => {
                setOfficialId(event.target.value.toLowerCase().replace(/\s/g, ""));
                notifyChange();
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. admin.rpr"
              autoComplete="username"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Available demo authority IDs">
            {authorityIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => { setOfficialId(id); notifyChange(); }}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${officialId === id ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"}`}
              >
                {officialId === id && <Check size={11} className="mr-1 inline" />}{id}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="authority-credential" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Password / Security PIN</label>
            <Link to="/auth/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              id="authority-credential"
              type={showCredential ? "text" : "password"}
              required
              value={credential}
              onChange={(event) => { setCredential(event.target.value); notifyChange(); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Enter password or security PIN"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCredential((visible) => !visible)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showCredential ? "Hide credential" : "Show credential"}
            >
              <Eye size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300"><KeyRound size={13} /> Demo access</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-600 dark:text-slate-400">ID: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{authorityIds[0]}</span></p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{DEMO_AUTHORITY_PASSWORD}</span></p>
          </div>
          <button type="button" onClick={() => loadDemoCredentials()} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-blue-700">
            Use credentials
          </button>
        </div>
        <div className="mt-2 flex gap-3 border-t border-blue-100 pt-2 dark:border-blue-900/70">
          <button type="button" onClick={() => copyValue(authorityIds[0], "id")} className="flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-400">
            {copied === "id" ? <Check size={11} /> : <Copy size={11} />} {copied === "id" ? "ID copied" : "Copy ID"}
          </button>
          <button type="button" onClick={() => copyValue(DEMO_AUTHORITY_PASSWORD, "password")} className="flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-400">
            {copied === "password" ? <Check size={11} /> : <Copy size={11} />} {copied === "password" ? "Password copied" : "Copy password"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Verifying authority..." : <>Verify & Login <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" /></>}
      </button>
    </form>
  );
}
