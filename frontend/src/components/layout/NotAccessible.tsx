import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function NotAccessible() {
  const navigate = useNavigate();
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100 text-red-600">
        <ShieldAlert size={40} />
      </div>
      <h2 className="mb-2 text-3xl font-black text-slate-900">Not accessible by you</h2>
      <p className="mb-8 max-w-md text-lg text-slate-500">
        You do not have the necessary permissions to view this page. If you believe this is a mistake, please contact your administrator.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
