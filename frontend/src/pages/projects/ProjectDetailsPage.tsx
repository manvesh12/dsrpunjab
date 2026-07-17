import { BookOpen, ChartNoAxesCombined, FileCheck2, FileText, Images, Layers3, Map, RefreshCw, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";

const modules = [
  ["Front Matter", "Certificates, contents and acknowledgements", "front-matter", FileText, 70],
  ["Chapters", "Core DSR chapters and review status", "chapters", BookOpen, 45],
  ["Plates & Maps", "District, geology and mining maps", "plates", Map, 20],
  ["Cross Sections", "River profiles and cross-section graphs", "cross-sections", ChartNoAxesCombined, 10],
  ["Annexures", "Annexures I–VII and B–K", "annexures", Layers3, 35],
  ["Replenishment", "Survey inputs and replenishment calculations", "replenishment", RefreshCw, 15],
  ["Model DSR", "Project-specific compiled model report", "model-dsr", FileCheck2, 0],
  ["Reviewer & Workflow", "Sequential approval, e-signatures and review notes", "reviewer", ShieldCheck, 0],
  ["Report Preview", "Review the compiled document", "preview", Images, 0],
  ["Generate PDF", "Validate and create the final report", "generate", FileCheck2, 0],
] as const;

export default function ProjectDetailsPage() {
  const { projectId = "1" } = useParams();
  return <>
    <PageHeader title="District Survey Report – Jalandhar" description={`Project #${projectId} • Financial Year 2025–26 • Sand and Minor Minerals`} action={<Link to="/projects" className="module-btn">Back to Projects</Link>} />
    <section className="mb-6 grid gap-4 sm:grid-cols-3"><Stat label="Overall progress" value="38%"/><Stat label="Sections completed" value="6 / 22"/><Stat label="Last autosave" value="Just now"/></section>
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{modules.map(([title, description, path, Icon, progress]) => <Link key={path} to={`/projects/${projectId}/${path}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"><Icon size={21}/></span><span className="text-sm font-bold text-slate-500">{progress}%</span></div><h2 className="mt-4 font-bold text-slate-900">{title}</h2><p className="mt-1 min-h-10 text-sm text-slate-500">{description}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${progress}%`}}/></div></Link>)}</section>
  </>;
}

function Stat({label,value}:{label:string;value:string}) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>; }
