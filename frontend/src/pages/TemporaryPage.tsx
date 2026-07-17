import { ArrowRight, CheckCircle2, Clock3, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";

type TemporaryPageProps = {
  title: string;
  description: string;
  projectWorkspace?: boolean;
};

export default function TemporaryPage({
  title,
  description,
  projectWorkspace = false,
}: TemporaryPageProps) {
  const actions = projectWorkspace
    ? ["Edit section data", "Upload supporting documents", "Save draft and continue"]
    : ["View current records", "Create or update entries", "Export module report"];

  return (
    <>
      <PageHeader title={title} description={description} />

      <section className="grid gap-5 md:grid-cols-3">
        {[
          ["Available", "Module is configured and routed", CheckCircle2, "text-emerald-600 bg-emerald-50"],
          ["Draft items", "Continue saved DSR work", Clock3, "text-amber-600 bg-amber-50"],
          ["Documents", "Manage files and generated reports", FileText, "text-blue-600 bg-blue-50"],
        ].map(([label, copy, Icon, color]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 flex size-11 items-center justify-center rounded-xl ${color}`}>
              <Icon size={21} />
            </div>
            <h2 className="font-bold text-slate-900">{String(label)}</h2>
            <p className="mt-1 text-sm text-slate-500">{String(copy)}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">{title} workspace</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {actions.map((action) => (
            <button key={action} type="button" className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
              {action}<ArrowRight size={17} />
            </button>
          ))}
        </div>
        {projectWorkspace && (
          <Link to="/projects" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
            Back to all projects <ArrowRight size={16} />
          </Link>
        )}
      </section>
    </>
  );
}
