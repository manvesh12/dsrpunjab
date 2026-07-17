import { Calculator, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/layout/PageHeader";
import { useLocalDraft } from "../../hooks/useLocalDraft";

type Site = { name:string; preLevel:string; postLevel:string; area:string; bulkDensity:string };
const initial: Site[] = [{name:"Sutlej Site 01",preLevel:"248.40",postLevel:"248.72",area:"12500",bulkDensity:"1.65"}];

export default function ReplenishmentBuilderPage() {
  const [sites,setSites] = useLocalDraft<Site[]>("replenishment-sites", initial);
  const update=(i:number,key:keyof Site,value:string)=>setSites((current)=>current.map((site,index)=>index===i?{...site,[key]:value}:site));
  const volume=(site:Site)=>Math.max(0,(Number(site.postLevel)-Number(site.preLevel))*Number(site.area));
  const quantity=(site:Site)=>volume(site)*Number(site.bulkDensity);
  const total=sites.reduce((sum,site)=>sum+quantity(site),0);
  return <><PageHeader title="Replenishment Report Builder" description="Calculate seasonal deposition from pre- and post-monsoon survey levels" action={<button className="module-btn-primary" onClick={()=>toast.success("Replenishment draft saved")}><Save size={17}/>Save Draft</button>}/>
    <section className="mb-5 grid gap-4 md:grid-cols-3"><Metric label="Survey sites" value={String(sites.length)}/><Metric label="Estimated replenishment" value={`${total.toFixed(2)} MT`}/><Metric label="Method" value="Level difference"/></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-bold">Site calculations</h2><p className="text-sm text-slate-500">Volume = level difference × area; Quantity = volume × bulk density</p></div><button className="module-btn-primary" onClick={()=>setSites((current)=>[...current,{name:"",preLevel:"",postLevel:"",area:"",bulkDensity:"1.65"}])}><Plus size={17}/>Add Site</button></div><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{["Site","Pre Level (m)","Post Level (m)","Area (m²)","Bulk Density","Volume (m³)","Quantity (MT)",""].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{sites.map((site,i)=><tr key={i} className="border-t">{(["name","preLevel","postLevel","area","bulkDensity"] as (keyof Site)[]).map(key=><td key={key} className="p-2"><input value={site[key]} type={key==="name"?"text":"number"} step="any" onChange={e=>update(i,key,e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"/></td>)}<td className="px-3 font-semibold">{volume(site).toFixed(2)}</td><td className="px-3 font-semibold text-blue-700">{quantity(site).toFixed(2)}</td><td><button onClick={()=>setSites(c=>c.filter((_,index)=>index!==i))} className="rounded p-2 text-red-500 hover:bg-red-50"><Trash2 size={17}/></button></td></tr>)}</tbody></table></div></section>
  </>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-slate-500"><Calculator size={16}/>{label}</div><p className="mt-2 text-xl font-bold">{value}</p></div>}
