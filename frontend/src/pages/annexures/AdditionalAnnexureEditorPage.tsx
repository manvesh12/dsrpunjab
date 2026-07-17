import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import ModuleEditor from "../../components/ui/ModuleEditor";
import type { EditorColumn } from "../../components/ui/ModuleEditor";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Download, FileSpreadsheet } from "lucide-react";
import {
  exportAnnexureExcel,
  exportAnnexurePdf,
} from "../../utils/annexureExport";

const key = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
const uploadOnly = ["B", "C", "D", "E", "G", "H", "I"];
const definitions: Record<string, { title: string; columns: string[] }[]> = {
  F: [
    {
      title: "a) Final Block Sand Ghats Coordinates",
      columns: [
        "Sl. No.",
        "River Details",
        "Sand Bar Code",
        "Lease Details",
        "Area (Ha.)",
        "Latitude",
        "Longitude",
      ],
    },
    {
      title: "b) Permanent Bench Marks",
      columns: [
        "Sl. No.",
        "Permanent Bench Mark",
        "Coordinates",
        "Elevation",
        "Sandbars Code",
      ],
    },
    {
      title: "c) Survey of India CORS Stations",
      columns: [
        "Sl. No.",
        "CORS Station Name",
        "Lat",
        "Lon",
        "Height",
        "Station Code",
      ],
    },
  ],
  J: [
    {
      title: "Projected Demand of Gravel (in MT) District Wise",
      columns: [
        "Sr. No.",
        "District Name",
        "2022-23",
        "2023-24",
        "2024-25",
        "2025-26",
        "2026-27",
        "2027-28",
      ],
    },
  ],
  K: [
    {
      title: "Proforma for Auctioned Sites",
      columns: [
        "Sr No.",
        "Site Name",
        "Type of Mine",
        "Date of Grant of EC",
        "Date of Start of Contract",
        "Quantity Allowed per annum",
        "Quantity Extracted",
        "Balance Quantity",
        "EC Status",
        "Reason For Not Operating Site",
        "Reason for not Applying EC",
        "Remarks",
      ],
    },
    {
      title: "Annexure A - Source-wise Summary",
      columns: [
        "Source",
        "No. of proposed sites",
        "Area (Ha)",
        "Total excavation in Tonnes",
        "Total excavation in Tonnes (Considering 60% as per EMGSM, 2020)",
      ],
    },
  ],
};

export default function AdditionalAnnexureEditorPage({
  letter,
}: {
  letter: string;
}) {
  const { projectId = "default" } = useParams();
  const items = definitions[letter] ?? [];
  const [snapshots, setSnapshots] = useState<
    Record<
      number,
      { title: string; columns: EditorColumn[]; rows: Record<string, string>[]; attachments?: string[] }
    >
  >({});
  return (
    <>
      <PageHeader
        title={`Annexure ${letter}`}
        description={
          uploadOnly.includes(letter)
            ? `Upload and manage Annexure ${letter} PDFs and images`
            : "Original additional-annexure formats"
        }
        action={
          <div className="flex gap-2">
            <button
              className="module-btn"
              onClick={() =>
                exportAnnexureExcel(
                  `Annexure ${letter}`,
                  Object.values(snapshots),
                )
              }
            >
              <FileSpreadsheet size={17} />
              Excel
            </button>
            <button
              className="module-btn"
              onClick={() =>
                exportAnnexurePdf(
                  `Annexure ${letter}`,
                  Object.values(snapshots),
                )
              }
            >
              <Download size={17} />
              PDF
            </button>
          </div>
        }
      />
      <div className="h-[calc(100vh-14rem)] flex">
        <ResizableLayout 
          leftPanelDefaultSize={60} rightPanelDefaultSize={40}
          leftPanel={
            <div className="min-w-0 pb-12">
              {uploadOnly.includes(letter) && <UploadPanel letter={letter} />}{" "}
              {items.map((item, index) => (
                <ModuleEditor
                  key={item.title}
                  embedded
                  editableStructure
                  showLivePreview={false}
                  storageKey={`project-${projectId}:annexure-${letter.toLowerCase()}-${index}`}
                  title={item.title}
                  description="Original IIT DSR table format"
                  columns={item.columns.map((label) => ({
                    key: key(label),
                    label,
                  }))}
                  sampleRows={
                    letter === "K" && index === 1
                      ? [
                          {
                            source: "River Bed Sand",
                            no_of_proposed_sites: "12",
                            area_ha: "48.60",
                            total_excavation_in_tonnes: "325000",
                            total_excavation_in_tonnes_considering_60_as_per_emgsm_2020:
                              "195000",
                          },
                        ]
                      : letter === "F" && index === 0
                      ? [
                          {
                            sl_no: "1",
                            river_details: "Sutlej River",
                            sand_bar_code: "SB-01",
                            lease_details: "Ludhiana Lease",
                            area_ha_: "12.5",
                            latitude: "30.900965",
                            longitude: "75.857277",
                          },
                        ]
                      : []
                  }
                  onSnapshotChange={(snapshot) =>
                    setSnapshots((current) =>
                      JSON.stringify(current[index]) === JSON.stringify(snapshot)
                        ? current
                        : { ...current, [index]: snapshot },
                    )
                  }
                />
              ))}
            </div>
          }
          rightPanel={
            <aside className="h-full rounded-2xl border bg-slate-200 p-4 block">
              <p className="mb-3 text-xs font-bold uppercase text-slate-600">
                Annexure {letter} Live Preview
              </p>
              <div className="min-h-[800px] bg-white p-8 shadow">
                <p className="text-center text-xs font-bold uppercase tracking-[.2em]">
                  Government of Punjab
                </p>
                <h1 className="mt-3 border-b-2 pb-5 text-center text-xl font-bold uppercase">
                  Annexure {letter}
                </h1>
                {items.length ? (
                  items.map((item, index) => {
                    const snap = snapshots[index];
                    const columns =
                      snap?.columns ??
                      item.columns.map((label) => ({ key: key(label), label }));
                    return (
                      <section className="mt-7" key={index}>
                        <h2 className="mb-3 text-sm font-bold">
                          {snap?.title ?? item.title}
                        </h2>
                        <table className="w-full border-collapse text-[8px]">
                          <thead>
                            <tr>
                              {columns.map((column) => (
                                <th
                                  key={column.key}
                                  className="border bg-slate-100 p-1 text-left"
                                >
                                  {column.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {snap?.rows.length ? (
                              snap.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {columns.map((column) => (
                                    <td key={column.key} className="border p-1">
                                      {row[column.key] || "—"}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={columns.length}
                                  className="border p-3 text-center text-slate-400"
                                >
                                  No entries
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </section>
                    );
                  })
                ) : (
                  <p className="mt-12 text-center text-sm text-slate-500">
                    Annexure {letter} is an upload-only annexure.
                    <br />
                    (No table preview available)
                  </p>
                )}
              </div>
            </aside>
          }
        />
      </div>
    </>
  );
}

function UploadPanel({ letter }: { letter: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold">Annexure {letter} Entries</h2>
      <p className="mt-1 text-sm text-slate-500">
        Uploaded PDF pages or images will be appended to the final annexure.
      </p>
      <label className="mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center hover:border-blue-400 hover:bg-blue-50">
        <span className="font-semibold text-slate-700">
          Select PDF or images
        </span>
        <span className="mt-1 text-sm text-slate-500">
          PDF, PNG or JPG • multiple files supported
        </span>
        <input
          type="file"
          accept="application/pdf,image/*"
          multiple
          className="hidden"
        />
      </label>
    </section>
  );
}
