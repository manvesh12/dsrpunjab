import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import PageHeader from "../../components/layout/PageHeader";
import {
  projectSchema,
  type ProjectFormData,
} from "../../schemas/project.schema";

const districts = [
  "Amritsar",
  "Barnala",
  "Bathinda",
  "Faridkot",
  "Fatehgarh Sahib",
  "Fazilka",
  "Ferozepur",
  "Gurdaspur",
  "Hoshiarpur",
  "Jalandhar",
  "Kapurthala",
  "Ludhiana",
  "Malerkotla",
  "Mansa",
  "Moga",
  "Pathankot",
  "Patiala",
  "Rupnagar",
  "Sahibzada Ajit Singh Nagar",
  "Sangrur",
  "Shaheed Bhagat Singh Nagar",
  "Sri Muktsar Sahib",
  "Tarn Taran",
];

export default function CreateProjectPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),

    defaultValues: {
      projectName: "",
      district: "Jalandhar",
      year: "2025-26",
      mineral: "Sand",
      rivers: "",
      preparedBy: "Sub-Divisional Committee",
    },
  });

  function onSubmit(data: ProjectFormData) {
    const title =
      data.projectName?.trim() ||
      `District Survey Report - ${data.district}`;

    const saved = JSON.parse(localStorage.getItem("dsr:projects") || "[]");
    const project = {
      id: `local-${saved.length + 1}`,
      projectName: title,
      district: data.district,
      financialYear: data.year,
      mineral: data.mineral,
      rivers: data.rivers?.trim() || "Not specified",
      status: "Draft",
      progress: 0,
      updatedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    };
    localStorage.setItem("dsr:projects", JSON.stringify([project, ...saved]));
    toast.success("DSR Project created and saved locally");
    navigate(`/projects/${project.id}`);
  }

  return (
    <>
      <PageHeader
        title="Create New DSR Project"
        description="Enter the project details to create a new District Survey Report."
        action={
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            Back to Projects
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-3xl"
      >
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Create New DSR Project
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Project information
              </p>
            </div>

            <Link
              to="/projects"
              aria-label="Close"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </Link>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label
                htmlFor="projectName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Report Title{" "}
                <span className="font-normal text-slate-400">
                  (optional)
                </span>
              </label>

              <input
                id="projectName"
                type="text"
                {...register("projectName")}
                placeholder="District Survey Report for Sand Mining"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              {errors.projectName && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.projectName.message}
                </p>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="district"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  District
                </label>

                <select
                  id="district"
                  {...register("district")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>

                {errors.district && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.district.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="year"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Year
                </label>

                <input
                  id="year"
                  type="text"
                  {...register("year")}
                  placeholder="2025-26"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

                {errors.year && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.year.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="mineral"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Mineral Type
                </label>

                <select
                  id="mineral"
                  {...register("mineral")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="Sand">Sand</option>
                  <option value="RBM">RBM</option>
                  <option value="Bajri">Bajri</option>
                  <option value="Gravel">Gravel</option>
                </select>

                {errors.mineral && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.mineral.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="rivers"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  River(s)
                </label>

                <input
                  id="rivers"
                  type="text"
                  {...register("rivers")}
                  placeholder="Sutlej, Beas"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />

                {errors.rivers && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.rivers.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="preparedBy"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Prepared By
              </label>

              <input
                id="preparedBy"
                type="text"
                {...register("preparedBy")}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              {errors.preparedBy && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.preparedBy.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Link
              to="/projects"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={false}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />

              Create Project →
            </button>
          </div>
        </section>
      </form>
    </>
  );
}
