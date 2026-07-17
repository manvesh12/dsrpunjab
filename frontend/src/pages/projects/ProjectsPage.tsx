import { Plus, Search, FolderKanban, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import type {
  Project,
  ProjectStatus,
} from "../../types/project.types";

const demoProjects: Project[] = [
  {
    id: "1",
    projectName: "District Survey Report – Ludhiana",
    district: "Ludhiana",
    financialYear: "2025-26",
    mineral: "Minor Minerals",
    status: "In Progress",
    progress: 65,
    updatedAt: "17 July 2026",
  },
  {
    id: "2",
    projectName: "District Survey Report – Jalandhar",
    district: "Jalandhar",
    financialYear: "2025-26",
    mineral: "Sand",
    status: "Under Review",
    progress: 85,
    updatedAt: "15 July 2026",
  },
  {
    id: "3",
    projectName: "District Survey Report – Patiala",
    district: "Patiala",
    financialYear: "2025-26",
    mineral: "Minor Minerals",
    status: "Draft",
    progress: 25,
    updatedAt: "12 July 2026",
  },
  {
    id: "4",
    projectName: "District Survey Report – Rupnagar",
    district: "Rupnagar",
    financialYear: "2024-25",
    mineral: "Sand and Gravel",
    status: "Approved",
    progress: 100,
    updatedAt: "10 July 2026",
  },
];

const statusStyles: Record<ProjectStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const local = JSON.parse(localStorage.getItem("dsr:projects") || "[]") as Project[];
      return [...local, ...demoProjects];
    } catch {
      return demoProjects;
    }
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      const local = next.filter(p => !demoProjects.find(d => d.id === p.id));
      localStorage.setItem("dsr:projects", JSON.stringify(local));
      return next;
    });
  };
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        project.projectName.toLowerCase().includes(searchValue) ||
        project.district.toLowerCase().includes(searchValue);

      const matchesStatus =
        status === "All" || project.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status]);

  return (
    <>
      <PageHeader
        title="My DSR Projects"
        description="All district survey reports across Punjab"
        action={
          <Link
            to="/projects/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            New Project
          </Link>
        }
      />

      {/* Filters */}
      <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-xl p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project or district..."
            className="w-full rounded-xl border border-slate-200 bg-white/50 py-2.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        >
          <option value="All">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="In Progress">In Progress</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
        </select>
      </section>

      {/* Projects Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
        {filteredProjects.map((project) => (
          <article
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200"
          >
            <div className="mb-5 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                  {project.projectName}
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {project.district} District • {project.financialYear}
                </p>
              </div>
              <button
                onClick={(e) => handleDeleteProject(e, project.id)}
                className="rounded-lg p-2 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                title="Delete Project"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                ⛏ {project.mineral}
              </span>
              <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${statusStyles[project.status]}`}>
                {project.status === "Approved" ? "✅" : project.status === "Under Review" ? "⏳" : "📝"} {project.status}
              </span>
            </div>

            <div className="mt-auto pt-5 border-t border-slate-100 relative">
              <div className="flex items-end justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Last Updated: {project.updatedAt}
                </span>
                <span className={`text-sm font-black ${project.progress === 100 ? "text-emerald-600" : "text-blue-700"}`}>
                  {project.progress}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    project.progress === 100 
                      ? "bg-emerald-500" 
                      : "bg-gradient-to-r from-blue-500 to-indigo-500"
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            
            {/* Glow effect on hover */}
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </article>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-16 text-center">
            <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No projects found</h3>
            <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </section>
    </>
  );
}
