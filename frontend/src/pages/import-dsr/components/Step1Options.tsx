
import { FileUp, FilePlus, ChevronRight } from "lucide-react";

interface Step1OptionsProps {
  onSelectOption: (option: "upload" | "skip") => void;
}

export default function Step1Options({ onSelectOption }: Step1OptionsProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Import Previous DSR</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          Choose how you want to proceed with the new District Survey Report.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Option 1: Upload */}
        <div 
          onClick={() => onSelectOption("upload")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-8 transition-all hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-blue-500/10 dark:text-blue-400">
            <FileUp size={32} />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Upload Existing DSR PDF</h2>
          <p className="mb-8 text-slate-600 dark:text-slate-400">
            Use when the district already has an approved DSR. The system will automatically extract and structure all information.
          </p>
          <div className="flex items-center font-semibold text-blue-600 group-hover:text-blue-700 dark:text-blue-400">
            Start Import Workflow
            <ChevronRight size={18} className="ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Option 2: Skip */}
        <div 
          onClick={() => onSelectOption("skip")}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-8 transition-all hover:border-slate-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-slate-500/10 blur-2xl transition-all group-hover:bg-slate-500/20" />
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900 transition-colors dark:bg-slate-800 dark:text-slate-400">
            <FilePlus size={32} />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Skip Import</h2>
          <p className="mb-8 text-slate-600 dark:text-slate-400">
            Create a completely fresh DSR. Start from Phase 1 and enter all data manually without importing prior documents.
          </p>
          <div className="flex items-center font-semibold text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white">
            Start Fresh Project
            <ChevronRight size={18} className="ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
