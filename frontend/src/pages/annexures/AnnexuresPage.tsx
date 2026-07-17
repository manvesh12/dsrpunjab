import { FileSpreadsheet, Paperclip } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";

const primary = ["Sand Sources", "Mining Leases", "Cluster Details", "Transport", "Bench Mark & CORS", "Final Cluster Details", "Transportation Routes"];
const additional = ["B","C","D","E","F","G","H","I","J","K"];

export default function AnnexuresPage(){
 const {projectId="1"}=useParams();
 return <><PageHeader title="Annexures" description="Prepare official schedules and supporting annexures"/>
 <h2 className="mb-3 font-bold text-slate-900">Primary Annexures I–VII</h2><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{primary.map((name,index)=><Link key={name} to={`/projects/${projectId}/annexures/${index+1}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">{index+1}</span><div><h3 className="font-bold group-hover:text-blue-700">Annexure {index+1}</h3><p className="text-sm text-slate-500">{name}</p></div></div></Link>)}</section>
 <h2 className="mb-3 mt-7 font-bold text-slate-900">Additional Annexures B–K</h2><section className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">{additional.map(letter=><Link key={letter} to={`/projects/${projectId}/annexures/additional/${letter.toLowerCase()}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 font-semibold shadow-sm hover:border-blue-300 hover:text-blue-700"><Paperclip size={18}/>Annexure {letter}</Link>)}</section>
 <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><FileSpreadsheet className="mr-2 inline" size={17}/>Every annexure supports manual rows, spreadsheet selection, local draft storage and preview.</div></>;
}
