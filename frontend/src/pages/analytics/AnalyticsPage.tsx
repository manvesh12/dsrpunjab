import { BarChart, PieChart, Activity, Users, Map, FileCheck, TrendingUp } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor real-time metrics and progress of District Survey Reports across Punjab."
      />

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Total DSRs", value: "23", subtitle: "Across 23 Districts", icon: <Map className="text-blue-600" />, bg: "bg-blue-50", border: "border-blue-200" },
          { title: "Approved", value: "8", subtitle: "34% of total", icon: <FileCheck className="text-emerald-600" />, bg: "bg-emerald-50", border: "border-emerald-200" },
          { title: "In Progress", value: "12", subtitle: "Active drafting", icon: <Activity className="text-amber-600" />, bg: "bg-amber-50", border: "border-amber-200" },
          { title: "Contributors", value: "145", subtitle: "Active users", icon: <Users className="text-purple-600" />, bg: "bg-purple-50", border: "border-purple-200" }
        ].map((kpi, idx) => (
          <div key={idx} className={`rounded-3xl border ${kpi.border} bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${kpi.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-4xl font-black text-slate-900 mt-2 mb-1">{kpi.value}</h3>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <TrendingUp size={12} className="text-emerald-500" />
                  {kpi.subtitle}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Chart */}
        <div className="col-span-1 lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900">Monthly Progress</h3>
              <p className="text-sm font-medium text-slate-500">DSR completion rate over the last 6 months</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <BarChart size={20} />
            </div>
          </div>
          
          {/* Mock Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {[40, 25, 60, 45, 80, 65].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center gap-3 group relative">
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded-md">
                  {h} DSRs
                </div>
                <div className="w-full bg-blue-100 rounded-t-xl relative overflow-hidden h-full">
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl transition-all duration-1000 group-hover:brightness-110" 
                    style={{ height: `${h}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart */}
        <div className="col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900">Status Distribution</h3>
              <p className="text-sm font-medium text-slate-500">Current state of all projects</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <PieChart size={20} />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
            {/* CSS Donut Chart Mock */}
            <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 relative">
              <div className="absolute inset-[-16px] rounded-full border-[16px] border-transparent border-t-emerald-500 border-r-emerald-500 transform rotate-45"></div>
              <div className="absolute inset-[-16px] rounded-full border-[16px] border-transparent border-b-blue-500 border-l-blue-500 transform -rotate-12"></div>
              <div className="absolute inset-[-16px] rounded-full border-[16px] border-transparent border-l-amber-400 transform -rotate-[60deg] clip-half"></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">23</span>
                <span className="text-xs font-bold text-slate-500">Total</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="font-semibold text-slate-700">Approved</span></div>
              <span className="font-bold text-slate-900">34%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="font-semibold text-slate-700">In Progress</span></div>
              <span className="font-bold text-slate-900">52%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span className="font-semibold text-slate-700">Draft</span></div>
              <span className="font-bold text-slate-900">14%</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
