import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import ModuleEditor, {
  type EditorColumn,
} from "../../components/ui/ModuleEditor";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, FileSpreadsheet, Plus } from "lucide-react";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import {
  exportAnnexureExcel,
  exportAnnexurePdf,
} from "../../utils/annexureExport";

type Section = { title: string; description: string; columns: string[] };
const col = (labels: string[]): EditorColumn[] =>
  labels.map((label) => ({
    key: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, ""),
    label,
  }));
const cluster = [
  "River Name",
  "Cluster No.",
  "Lease No.",
  "Location (Riverbed / Patta Land)",
  "Village",
  "Area (in Ha.)",
  "Total Excavation (MT)",
  "Total Mineral Excavation (MT) (Considering 60% as per EMGSM, 2020)",
];
const contiguous = [
  "River Name",
  "Contiguous Cluster No.",
  "Cluster No.",
  "Number of leases in the cluster",
  "Location (Riverbed / Patta Land)",
  "Distance between clusters",
  "Village",
  "Area Of Cluster (Ha)",
  "Total Mineral Excavation (MT) (Considering 60% as per EMGSM, 2020)",
];
const sections: Record<
  string,
  { title: string; description: string; items: Section[] }
> = {
  "1": {
    title: "Annexure I - Sand Sources",
    description: "Original source inventory formats",
    items: [
      {
        title: "a) Rivers",
        description: "River source master",
        columns: [
          "River Name/M-Sand Plant",
          "Total Stretch of River (in KM)",
          "Type of River (Perennial or Non Perennial)",
        ],
      },
      {
        title: "b) De-Siltation Location (Lakes/Ponds/Dams etc.)",
        description: "Reservoir and desiltation locations",
        columns: [
          "Name of Reservoir/Dams",
          "Maintain/Controlled by State Govt./PSU etc.",
          "Latitude",
          "Longitude",
          "District",
          "Tehsil",
          "Village",
          "Size (Ha)",
        ],
      },
      {
        title: "c) Patta lands/Khatedari land",
        description: "Private land source details",
        columns: [
          "Owner",
          "SL. No",
          "Area (Ha)",
          "District",
          "Tehsil",
          "Village",
          "Agricultural Land (Yes/No)",
        ],
      },
      {
        title: "d) M-Sand Plants",
        description: "Manufactured sand plant inventory",
        columns: [
          "Plant Name",
          "Owner",
          "District",
          "Tehsil",
          "Village",
          "Geo-location",
          "Quantity Tonnes/Annum",
        ],
      },
    ],
  },
  "2": {
    title: "Annexure II - Mining Leases",
    description: "Existing and proposed mining lease formats",
    items: [
      {
        title: "a) Potential Mining Leases – Rivers",
        description: "Riverbed lease schedule",
        columns: [
          "Sl. No.",
          "River Details",
          "Sand Bar Code",
          "Lease Details",
          "Area (Ha)",
          "Latitude",
          "Longitude",
          "Distance from PA/WC (KM)",
          "Within 500m? (Cluster Area)",
          "Bulk Density (gm/cc)",
          "Depth of Deposit (m)",
          "Total Excavation (MT/YR)",
          "Total Excavation (Net 60%)",
          "Mineral",
          "Existing/Proposed",
          "Remarks",
        ],
      },
      {
        title: "b) Patta lands/Khatedari land",
        description: "Existing and proposed private land leases",
        columns: [
          "Sl.no",
          "Owner",
          "Sy.No (Khasra No)",
          "Area (Ha)",
          "Latitude",
          "Longitude",
          "District",
          "Tehsil",
          "Village",
          "Total Reserve (MT)",
          "Total Mineral (60% MT)",
          "Existing/Proposed",
          "Remarks",
        ],
      },
      {
        title: "c) De-Siltation Locations",
        description: "Existing and proposed desiltation sites",
        columns: [
          "Name of Reservoir/Dams",
          "Maintain/Controlled by State Govt./PSU etc.",
          "Latitude",
          "Longitude",
          "District",
          "Tehsil",
          "Village",
          "Size (Ha)",
          "Quantity MT/Year",
          "Existing/Proposed",
        ],
      },
      {
        title: "d) M-Sand Plants",
        description: "Existing and proposed plant schedule",
        columns: [
          "Plant Name",
          "Owner",
          "District",
          "Tehsil",
          "Village",
          "Geo-location",
          "Quantity Tonnes/Annum",
          "Existing/Proposed",
        ],
      },
    ],
  },
  "3": {
    title: "Annexure III - Cluster Details",
    description: "Original cluster and contiguous cluster schedules",
    items: [
      {
        title: "a) Cluster Details",
        description: "Lease grouping schedule",
        columns: cluster,
      },
      {
        title: "b) Contiguous Clusters",
        description: "Inter-cluster schedule",
        columns: contiguous,
      },
    ],
  },
  "4": {
    title: "Annexure IV - Transportation Routes",
    description: "Route control-point format",
    items: [
      {
        title: "Transportation Route Points",
        description: "Route coordinates and elevation",
        columns: [
          "Point Name",
          "Type",
          "Latitude",
          "Longitude",
          "Elevation (m)",
          "Remarks",
        ],
      },
    ],
  },
  "5": {
    title: "Annexure V - Sand Mining Report",
    description: "Detailed proposed mining inventory",
    items: [
      {
        title: "Sand Mining Sites",
        description: "EMGSM 2020 excavation schedule",
        columns: [
          "Sl No.",
          "River Details",
          "Sand Bar Code",
          "Lease Details",
          "Area (Ha.)",
          "Latitude",
          "Longitude",
          "Distance (KM) from PA/BR/WC",
          "Distance from Forest Area (KM)",
          "Mining leases within 500 m (if yes cluster area)",
          "Bulk Density (gm/cc)",
          "Depth of Deposit [Actual avg depth or 3m]",
          "Total Excavation (MT/YR)",
          "Total Excavation MT/YR (Consid. 60%)",
          "Mineral to be mined",
          "Existing / Proposed",
          "Remarks",
        ],
      },
    ],
  },
  "6": {
    title: "Annexure VI - Final Cluster Details",
    description: "Final approved cluster schedules",
    items: [
      {
        title: "Final Cluster Details",
        description: "Final individual cluster table",
        columns: cluster,
      },
      {
        title: "Final Contiguous Clusters",
        description: "Final contiguous cluster table",
        columns: contiguous,
      },
    ],
  },
  "7": {
    title: "Annexure VII - Transportation Routes",
    description: "Final sandbar, benchmark and CORS route formats",
    items: [
      {
        title: "Final Block Sand Ghats Coordinates",
        description: "Sandbar and lease coordinates",
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
        title: "Permanent Bench Marks",
        description: "Permanent survey benchmark schedule",
        columns: [
          "Sl. No.",
          "Permanent Bench Mark",
          "Coordinates",
          "Elevation",
          "Sandbars Code",
        ],
      },
      {
        title: "Survey of India CORS Stations",
        description: "CORS station schedule",
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
  },
};

type Snapshot = {
  title: string;
  columns: EditorColumn[];
  rows: Record<string, string>[];
  attachments?: string[];
};
export default function AnnexureEditorPage({ annexure }: { annexure: string }) {
  const { projectId = "default" } = useParams();
  const data = sections[annexure] ?? sections["1"];
  const [snapshots, setSnapshots] = useState<Record<number, Snapshot>>({});
  const [customTables, setCustomTables] = useLocalDraft<number>(
    `project-${projectId}:annexure-${annexure}:custom-tables`,
    0,
  );
  const update = useCallback(
    (index: number, snapshot: Snapshot) =>
      setSnapshots((current) =>
        current[index] === snapshot
          ? current
          : { ...current, [index]: snapshot },
      ),
    [],
  );
  const total = data.items.length + customTables;
  return (
    <>
      <PageHeader
        title={data.title}
        description={data.description}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="module-btn"
              onClick={() =>
                exportAnnexureExcel(data.title, Object.values(snapshots))
              }
            >
              <FileSpreadsheet size={17} />
              Excel
            </button>
            <button
              className="module-btn"
              onClick={() =>
                exportAnnexurePdf(data.title, Object.values(snapshots))
              }
            >
              <Download size={17} />
              PDF
            </button>
            <button
              className="module-btn-primary"
              onClick={() => setCustomTables((value) => value + 1)}
            >
              <Plus size={17} />
              Create New Table
            </button>
          </div>
        }
      />
      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Table names, column headers, rows and values are fully editable.
        Download a CSV template or upload a filled CSV to create entries
        automatically.
      </div>
      <div className="h-[calc(100vh-14rem)] flex">
        <ResizableLayout 
          leftPanelDefaultSize={60} rightPanelDefaultSize={40}
          leftPanel={
            <div className="min-w-0 pb-12">
              {Array.from({ length: total }, (_, index) => {
                const item = data.items[index] ?? {
                  title: `New Table ${index - data.items.length + 1}`,
                  description: "Custom annexure table",
                  columns: ["Column 1", "Column 2"],
                };
                return (
                  <ModuleEditor
                    key={index}
                    embedded
                    editableStructure
                    showLivePreview={false}
                    storageKey={`project-${projectId}:annexure-${annexure}-${index}`}
                    title={item.title}
                    description={item.description}
                    columns={col(item.columns)}
                    sampleRows={
                      annexure === "1" && index === 0
                        ? [
                            {
                              river_name_m_sand_plant: "Sutlej River",
                              total_stretch_of_river_in_km: "45",
                              type_of_river_perennial_or_non_perennial: "Perennial",
                            },
                          ]
                        : annexure === "2" && index === 0
                        ? [
                            {
                              sl_no: "1",
                              river_details: "Sutlej River",
                              sand_bar_code: "SB-01",
                              lease_details: "Ludhiana Lease",
                              area_ha: "12.5",
                              latitude: "30.900965",
                              longitude: "75.857277",
                              distance_from_pa_wc_km: "10.5",
                              within_500m_cluster_area: "No",
                              bulk_density_gm_cc: "1.65",
                              depth_of_deposit_m: "3.0",
                              total_excavation_mt_yr: "618750",
                              total_excavation_net_60: "371250",
                              mineral: "Sand",
                              existing_proposed: "Proposed",
                              remarks: "Pending EC",
                            }
                          ]
                        : annexure === "3" && index === 0
                        ? [
                            {
                              river_name: "Sutlej",
                              cluster_no: "CL-01",
                              lease_no: "L-01, L-02",
                              location_riverbed_patta_land: "Riverbed",
                              village: "Phillaur",
                              area_in_ha: "25.0",
                              total_excavation_mt: "1237500",
                              total_mineral_excavation_mt_considering_60_as_per_emgsm_2020: "742500",
                            }
                          ]
                        : []
                    }
                    onSnapshotChange={(snapshot) => update(index, snapshot)}
                  />
                );
              })}
            </div>
          }
          rightPanel={
            <aside className="h-full rounded-2xl border bg-slate-200 p-4 shadow-sm block">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                Complete Annexure Live Preview
              </p>
              <div className="min-h-[900px] bg-white p-8 shadow">
                <div className="border-b-2 border-slate-900 pb-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-[.2em]">
                    Government of Punjab
                  </p>
                  <h1 className="mt-3 text-xl font-bold uppercase">{data.title}</h1>
                  <p className="mt-1 text-xs text-slate-500">
                    District Survey Report
                  </p>
                </div>
                {Array.from({ length: total }, (_, index) => {
                  const fallback = data.items[index];
                  const snap = snapshots[index];
                  const labels =
                    snap?.columns.map((c) => c.label) ?? fallback?.columns ?? [];
                  return (
                    <section key={index} className="mt-7">
                      <h2 className="border-b pb-2 text-sm font-bold">
                        {snap?.title ?? fallback?.title ?? `New Table ${index + 1}`}
                      </h2>
                      <PreviewSection labels={labels} rows={snap?.rows ?? []} />
                    </section>
                  );
                })}
              </div>
            </aside>
          }
        />
      </div>
    </>
  );
}

function PreviewSection({
  labels,
  rows,
}: {
  labels: string[];
  rows: Record<string, string>[];
}) {
  const keys = labels.map((label) =>
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, ""),
  );
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-[8px]">
        <thead>
          <tr>
            {labels.map((label) => (
              <th
                key={label}
                className="border border-slate-400 bg-slate-100 p-1 text-left align-top"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr key={i}>
                {keys.map((k) => (
                  <td key={k} className="border border-slate-300 p-1">
                    {row[k] || "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={labels.length}
                className="border p-3 text-center text-slate-400"
              >
                No entries
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
