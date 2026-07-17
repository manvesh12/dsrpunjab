import {
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  FilePlus,
  ArrowRight,
  Check,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    label: "Total Projects",
    value: "3",
    info: "Active DSR projects",
    icon: FolderKanban,
    color: "from-blue-600 to-indigo-600",
    bgLight: "bg-blue-50/80",
    textLight: "text-blue-600",
  },
  {
    label: "Completed",
    value: "1",
    info: "Reports finalized",
    icon: CheckCircle2,
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50/80",
    textLight: "text-emerald-600",
  },
  {
    label: "Pending Signatures",
    value: "4",
    info: "Awaiting authorities",
    icon: Clock3,
    color: "from-purple-500 to-violet-600",
    bgLight: "bg-purple-50/80",
    textLight: "text-purple-600",
  },
  {
    label: "PDFs Generated",
    value: "2",
    info: "Final reports ready",
    icon: FileText,
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50/80",
    textLight: "text-amber-600",
  },
];

const recentProjects = [
  { name: "Jalandhar DSR 2025-26", district: "Jalandhar", status: "In Progress", date: "Today" },
  { name: "Ludhiana DSR 2025-26", district: "Ludhiana", status: "Under Review", date: "Yesterday" },
  { name: "Bathinda DSR 2025-26", district: "Bathinda", status: "Completed", date: "2 days ago" },
];

const workflowSteps = [
  { title: "Project Initialized", sub: "Basic details, district, year, mineral type", active: false, done: true },
  { title: "Data Entry & Upload", sub: "Front matter, chapters, plates, graphs, annexures, tables", active: true, done: false },
  { title: "Generate Final PDF", sub: "Professional government-format report", active: false, done: false },
  { title: "Submit for Approval", sub: "Send to authority signing dashboard", active: false, done: false },
  { title: "Sequential E-Signing", sub: "5-level authority hierarchy · Final signed PDF", active: false, done: false },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 lg:space-y-8 animate-[fadeInUp_0.5s_ease-out_forwards]">
      
      {/* Running Notice Bar */}
      <div className="flex items-center overflow-hidden rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 shadow-sm py-2.5 relative transition-colors">
        <div className="flex items-center gap-2 font-black text-amber-700 dark:text-amber-500 whitespace-nowrap z-10 bg-amber-50 dark:bg-[#2A2111] px-4 border-r border-amber-200 dark:border-amber-700/50 shadow-[4px_0_10px_rgba(251,191,36,0.2)] dark:shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-colors">
          <Bell size={18} className="animate-pulse" />
          <span className="hidden sm:inline">LATEST NOTICES</span>
          <span className="sm:hidden">NOTICES</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-6">
          <div className="absolute inset-y-0 left-0 flex items-center hover:[animation-play-state:paused] animate-[marquee-horizontal_30s_linear_infinite] whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-300">
            <span className="mx-8">🚨 Guidelines for submission of DSR for the financial year 2026-27 have been updated.</span>
            <span className="mx-8">📌 District Survey Reports for Patiala and Ludhiana are now available for public review.</span>
            <span className="mx-8">⚠️ Scheduled maintenance on the portal this Sunday from 2 AM to 4 AM.</span>
            {/* Duplicated for seamless loop */}
            <span className="mx-8">🚨 Guidelines for submission of DSR for the financial year 2026-27 have been updated.</span>
            <span className="mx-8">📌 District Survey Reports for Patiala and Ludhiana are now available for public review.</span>
            <span className="mx-8">⚠️ Scheduled maintenance on the portal this Sunday from 2 AM to 4 AM.</span>
          </div>
        </div>
      </div>

      {/* Hero Banner Area */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
        <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14 flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-300 border border-slate-700/50 backdrop-blur-md">
            <span>🏛</span> Government of Punjab · EMGSM 2020 · IIT Ropar Research Cell
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mt-2 leading-tight">
            District Survey Report <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Automation Portal</span>
          </h1>
          <p className="max-w-2xl text-slate-300 font-medium leading-relaxed mt-2 text-sm sm:text-base">
            Prepare, review, and digitally sign DSRs for sand mining across all Punjab districts. Fully automated graph generation, annexure templates, and sequential e-signature workflow.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <Link to="/projects/create" className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:bg-blue-500 transition-all">
              <FilePlus size={18} />
              Create New DSR Project
            </Link>
            <Link to="/projects" className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all">
              View All Projects <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:hover:border-slate-700 hover:-translate-y-1"
          >
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.color} opacity-5 dark:opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-10 dark:group-hover:opacity-20`} />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${stat.bgLight} dark:bg-slate-800 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                <stat.icon size={22} className={`${stat.textLight} dark:text-white`} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">{stat.info}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Main Content Area */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Recent Projects */}
        <article className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col overflow-hidden transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Projects</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">Click to open and edit</p>
            </div>
            <Link to="/projects" className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              See All
            </Link>
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-2">
            {recentProjects.map((project, i) => (
              <Link key={i} to="/projects" className="flex items-center justify-between rounded-xl border border-transparent p-4 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm transition-all group">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{project.district} • Last updated {project.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                    project.status === 'Under Review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {project.status}
                  </span>
                  <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </article>

        {/* DSR Workflow Overview */}
        <article className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">DSR Workflow Overview</h3>
          </div>
          <div className="p-8">
            <div className="relative space-y-0">
              {workflowSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 relative pb-8 last:pb-0 group">
                  {/* Vertical Line */}
                  {i !== workflowSteps.length - 1 && (
                    <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${step.done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'} transition-colors duration-500`} />
                  )}
                  
                  {/* Step Dot */}
                  <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ring-4 ring-white dark:ring-slate-900 ${
                    step.done ? 'bg-emerald-500 text-white shadow-md' : 
                    step.active ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-blue-50 dark:ring-blue-900/30' : 
                    'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {step.done ? <Check size={14} strokeWidth={3} /> : (i + 1)}
                  </div>
                  
                  {/* Step Content */}
                  <div className="pt-1.5 flex-1">
                    <h4 className={`text-sm font-bold ${step.done ? 'text-slate-900 dark:text-slate-200' : step.active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-500'}`}>
                      {step.title}
                    </h4>
                    <p className={`text-xs mt-1 leading-relaxed ${step.active ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {step.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}