import { useState } from "react";
import { Check, AlertCircle, Save, Layers, CheckCircle2 } from "lucide-react";
import ResizableLayout from "../../../components/layout/ResizableLayout";

interface Step5ReviewProps {
  onImportComplete: () => void;
}

const mockSections = [
  { id: "general", name: "General Details", status: "matched" },
  { id: "rivers", name: "River Details", status: "conflict" },
  { id: "hydrology", name: "Hydrology", status: "missing" },
];

export default function Step5Review({ onImportComplete }: Step5ReviewProps) {
  const [activeSection, setActiveSection] = useState("general");
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, string>>({
    general: "matched",
    rivers: "conflict",
    hydrology: "missing",
  });

  const handleAcceptSection = (id: string) => {
    setSectionStatuses((prev) => ({ ...prev, [id]: "accepted" }));
  };

  const allAccepted = Object.values(sectionStatuses).every(status => status === "accepted" || status === "matched");

  const leftPanel = (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers size={18} className="text-blue-500" />
          Extracted Document Data
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === "general" && (
          <div className="space-y-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm dark:border-blue-900/30 dark:bg-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">District</p>
              <p className="font-medium text-slate-900 dark:text-white">Ludhiana</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Area</p>
              <p className="font-medium text-slate-900 dark:text-white">3767 Sq. Km.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preparation Date</p>
              <p className="font-medium text-slate-900 dark:text-white">15 March 2023</p>
            </div>
          </div>
        )}
        {activeSection === "rivers" && (
          <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/10">
            <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertCircle size={16} />
              <span className="text-sm font-semibold">Conflict Detected</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">River Name</p>
              <p className="font-medium text-slate-900 dark:text-white">Satluj River</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Length in District</p>
              <p className="font-medium text-slate-900 dark:text-white">98.5 km</p>
            </div>
          </div>
        )}
        {activeSection === "hydrology" && (
          <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/30 dark:bg-red-900/10">
             <div className="mb-2 flex items-center gap-2 text-red-600 dark:text-red-500">
              <AlertCircle size={16} />
              <span className="text-sm font-semibold">Missing Data</span>
            </div>
             <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Water Table Depth</p>
              <p className="font-medium text-slate-400 italic">Not found in document</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const rightPanel = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">Portal Data Structure</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === "general" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">District Name</label>
              <input type="text" defaultValue="Ludhiana" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Area (Sq. Km)</label>
              <input type="text" defaultValue="3767" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            </div>
             <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Report Date</label>
              <input type="date" defaultValue="2023-03-15" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            </div>
          </div>
        )}
        {activeSection === "rivers" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">River System</label>
              <input type="text" defaultValue="Sutlej" className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-700 dark:bg-amber-900/20" />
              <p className="mt-1 text-xs text-amber-600">Conflict: 'Satluj' (Doc) vs 'Sutlej' (Portal)</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Length (km)</label>
              <input type="number" defaultValue="98.5" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Replace with Doc
              </button>
              <button className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Keep Portal Data
              </button>
            </div>
          </div>
        )}
        {activeSection === "hydrology" && (
          <div className="space-y-4">
             <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Water Table Depth (m)</label>
              <input type="text" placeholder="Requires manual entry" className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm dark:border-red-700 dark:bg-red-900/20" />
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => handleAcceptSection(activeSection)}
          disabled={sectionStatuses[activeSection] === "accepted"}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500"
        >
          {sectionStatuses[activeSection] === "accepted" ? (
            <>
              <Check size={18} /> Section Accepted
            </>
          ) : (
            "Accept Section"
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col px-4 pb-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Review</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Review and resolve any conflicts before finalizing the import.</p>
        </div>
        <button
          onClick={onImportComplete}
          disabled={!allAccepted}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500"
        >
          <Save size={18} />
          Complete Import
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Document Sections</h3>
          <div className="space-y-1">
            {mockSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {section.name}
                {sectionStatuses[section.id] === "matched" || sectionStatuses[section.id] === "accepted" ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : sectionStatuses[section.id] === "conflict" ? (
                  <AlertCircle size={16} className="text-amber-500" />
                ) : (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <ResizableLayout leftPanel={leftPanel} rightPanel={rightPanel} leftPanelDefaultSize={50} rightPanelDefaultSize={50} />
        </div>
      </div>
    </div>
  );
}


