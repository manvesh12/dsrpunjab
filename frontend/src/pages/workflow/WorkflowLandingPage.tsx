import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ClipboardCheck, FolderKanban, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { projectsApi, type ProjectListItem } from "../../api/projects.api";
import PageHeader from "../../components/layout/PageHeader";

export default function WorkflowLandingPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    projectsApi.list({ limit: 100 })
      .then((response) => { if (active) setProjects(response.data); })
      .catch(() => { if (active) toast.error("Workflow projects could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) =>
      [project.title, project.projectName, project.district, project.year]
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [projects, query]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Review Workflow"
        description="Select a DSR project to review sections, manage observations and record the final decision"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by project, district or year…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <FolderKanban size={42} className="mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">No projects found</p>
          <p className="mt-1 text-sm text-slate-400">Try another search or check your district access.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardCheck size={19} />
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">
                  {project.status.replaceAll("_", " ")}
                </span>
              </div>
              <h2 className="mt-4 line-clamp-2 font-extrabold text-slate-800">
                {project.title || project.projectName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {[project.district, project.year, project.mineral].filter(Boolean).join(" · ") || "District DSR Project"}
              </p>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase text-slate-400">
                  <span>Project completion</span>
                  <span>{project.progress || 0}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${Math.max(0, Math.min(100, project.progress || 0))}%` }} />
                </div>
              </div>
              <Link
                to={`/projects/${project.id}/reviewer`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Open review workflow <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
