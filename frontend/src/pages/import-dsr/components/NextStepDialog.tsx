
import { ArrowRight, Search, FileUp, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NextStepDialogProps {
  onReview: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

export default function NextStepDialog({ onReview, onReplace, onCancel }: NextStepDialogProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm dark:bg-black/80">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
            <ArrowRight size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Previous DSR Imported Successfully</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Choose what you want to do next.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/projects/create")}
            className="flex w-full items-start gap-4 rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-left transition-colors hover:bg-blue-100 dark:border-blue-500/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
          >
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300">
              <ArrowRight size={20} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100">
                Continue to Phase 2 <span className="ml-2 rounded bg-blue-200 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-800 dark:text-blue-200">Recommended</span>
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Use imported data as the base. Only ask for new survey data (DGPS, Drone, DEM, updated widths).
              </p>
            </div>
          </button>

          <button
            onClick={onReview}
            className="flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <Search size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Review Imported Data</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Open every imported section in the portal editor before continuing to verify extraction details.
              </p>
            </div>
          </button>

          <button
            onClick={onReplace}
            className="flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <FileUp size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Replace Imported PDF</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Upload another DSR. Existing imported data will be overwritten after confirmation.
              </p>
            </div>
          </button>
          
          <button
            onClick={onCancel}
            className="flex w-full items-start gap-4 rounded-xl border border-red-200 bg-white p-4 text-left transition-colors hover:border-red-300 hover:bg-red-50 dark:border-red-900/30 dark:bg-slate-800 dark:hover:bg-red-900/20"
          >
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
              <XCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400">Cancel Import</h3>
              <p className="mt-1 text-sm text-red-600/70 dark:text-red-400/70">
                Delete all temporarily imported data and return to the main portal.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
