import { Download, Eye, FileText, Search, Filter } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";

const demoReports = [
  {
    id: "1",
    title: "DSR — Ludhiana Sand Mining",
    district: "Ludhiana",
    year: "2025-26",
    version: "v3.0 Final",
    generatedOn: "17 July 2026",
    status: "Approved",
    signatures: "5/5",
  },
  {
    id: "2",
    title: "DSR — Jalandhar Sand Mining",
    district: "Jalandhar",
    year: "2025-26",
    version: "v2.1 Draft",
    generatedOn: "15 July 2026",
    status: "Pending Signatures",
    signatures: "2/5",
  },
  {
    id: "3",
    title: "DSR — Patiala Minor Minerals",
    district: "Patiala",
    year: "2025-26",
    version: "v1.0 Draft",
    generatedOn: "12 July 2026",
    status: "Draft",
    signatures: "0/5",
  },
  {
    id: "4",
    title: "DSR — Rupnagar Sand and Gravel",
    district: "Rupnagar",
    year: "2024-25",
    version: "v4.0 Final",
    generatedOn: "10 July 2026",
    status: "Approved",
    signatures: "5/5",
  },
];

const statusStyles: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "Pending Signatures": "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
};

export default function ReportsPage() {
  const [search, setSearch] = useState("");

  const filteredReports = demoReports.filter((r) => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="DSR Reports Library"
        description="View and download generated drafts and final reports."
      />

      {/* Toolbar */}
      <section className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-xl p-4 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or district..."
            className="w-full rounded-xl border border-slate-200 bg-white/50 py-2 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center">
          <Filter size={16} />
          Filter Options
        </button>
      </section>

      {/* Reports List */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Report Title</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">District / Year</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Version</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Signatures</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <tr key={report.id} className="transition-colors hover:bg-slate-50/80 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${report.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">{report.title}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Generated: {report.generatedOn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="block text-sm font-bold text-slate-800">{report.district}</span>
                    <span className="block text-xs font-semibold text-slate-500 mt-1">{report.year}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 font-mono">
                      {report.version}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${statusStyles[report.status] || statusStyles.Draft}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{report.signatures}</span>
                      {report.signatures === "5/5" && <span className="text-emerald-500">✅</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all tooltip" title="View Preview">
                        <Eye size={16} />
                      </button>
                      <button className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                        report.status === 'Approved' 
                          ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 shadow-sm' 
                          : 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50'
                      }`} title="Download Final PDF">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-lg font-bold text-slate-700">No reports found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
