
import { CheckCircle2, ChevronRight, FileCheck, AlertTriangle } from "lucide-react";

interface Step4SummaryProps {
  onContinueToReview: () => void;
}

const extractedSections = [
  { name: "General Details", progress: 100 },
  { name: "River Details", progress: 100 },
  { name: "Hydrology", progress: 96 },
  { name: "Geology", progress: 100 },
  { name: "Environment", progress: 92 },
  { name: "Coordinates", progress: 100 },
  { name: "Tables", progress: 98 },
  { name: "Maps", progress: 90 },
  { name: "Annexures", progress: 100 },
  { name: "Photographs", progress: 95 },
];

export default function Step4Summary({ onContinueToReview }: Step4SummaryProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          <FileCheck size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Parsing Complete</h2>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          The document was successfully analyzed. Here is the extraction summary.
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Confidence Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">98%</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sections Identified</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black text-blue-600 dark:text-blue-400">12</span>
            <span className="text-sm font-medium text-slate-500">Major modules</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Unknown Data</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-500">2%</span>
            <span className="text-sm font-medium text-slate-500">Requires review</span>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">Extraction Details</h3>
        </div>
        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
          <div className="divide-y divide-slate-100 p-6 dark:divide-slate-800">
            {extractedSections.slice(0, 5).map((section) => (
              <div key={section.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <span className="font-medium text-slate-700 dark:text-slate-300">{section.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{section.progress}%</span>
                  {section.progress === 100 ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="divide-y divide-slate-100 p-6 dark:divide-slate-800">
            {extractedSections.slice(5).map((section) => (
              <div key={section.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <span className="font-medium text-slate-700 dark:text-slate-300">{section.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{section.progress}%</span>
                  {section.progress === 100 ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinueToReview}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Review Data & Import
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
