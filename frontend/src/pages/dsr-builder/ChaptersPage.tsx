import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import { useLocalDraft } from "../../hooks/useLocalDraft";
type Chapter = { name: string; summary: string; file?: { name: string; preview?: string } };
const initial: Chapter[] = [
  [
    "CHAPTER 1 - INTRODUCTION",
    "Overview of the district and purpose of the DSR under EMGSM 2020 guidelines.",
  ],
  [
    "CHAPTER 2 - OVERVIEW OF MINING ACTIVITIES IN THE DISTRICT",
    "Current and historical sand mining activities, lease details, and district statistics.",
  ],
  [
    "CHAPTER 3 - PROCESS OF DEPOSITION OF SEDIMENTS IN THE RIVERS OF THE DISTRICT",
    "River morphology, sedimentation rates, and annual replenishment estimates.",
  ],
  [
    "CHAPTER 4 - GENERAL PROFILE OF THE DISTRICT",
    "Geographic, demographic, and administrative profile of the district.",
  ],
  [
    "CHAPTER 5 - PHYSIOGRAPHY OF THE DISTRICT",
    "Terrain, drainage patterns, river systems, and physical features.",
  ],
  [
    "CHAPTER 6 - GEOLOGY AND MINERAL WEALTH",
    "Geological formations, mineral deposits, and subsurface characteristics.",
  ],
  [
    "CHAPTER 7 - ESTIMATION OF DEPOSITS AND REPLENISHMENT STUDIES",
    "Scientific estimation of available sand deposits and annual natural replenishment.",
  ],
  [
    "CHAPTER 8 - TRANSPORT",
    "Transportation infrastructure, road conditions, and logistics for mining operations.",
  ],
  [
    "CHAPTER 9 - REMEDIAL MEASURE TO MITIGATE THE IMPACT OF MINING",
    "Environmental safeguards, monitoring mechanisms, and impact mitigation plans.",
  ],
  [
    "CHAPTER 10 - CONCLUSION",
    "Summary findings, recommendations, and compliance declarations.",
  ],
].map(([name, summary]) => ({ name, summary }));
export default function ChaptersPage() {
  const [chapters, setChapters] = useLocalDraft<Chapter[]>(
    "chapters-exact",
    initial,
  );
  const move = (i: number, d: number) =>
    setChapters((c) => {
      const n = [...c];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  return (
    <>
      <PageHeader
        title="Report Chapters"
        description="10 chapters as per EMGSM 2020 • Edit headings and summaries • Upload chapter PDFs"
        action={
          <button
            className="module-btn-primary"
            onClick={() =>
              setChapters((c) => [
                ...c,
                {
                  name: "NEW CHAPTER - ENTER TITLE",
                  summary: "Enter chapter summary here...",
                },
              ])
            }
          >
            <Plus size={17} />
            Add Chapter
          </button>
        }
      />
      <div className="h-[calc(100vh-12rem)] flex">
        <ResizableLayout 
          leftPanelDefaultSize={60} rightPanelDefaultSize={40}
          leftPanel={
            <div className="space-y-3">
              {chapters.map((chapter, i) => (
                <article
                  key={i}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <input
                      value={chapter.name}
                      onChange={(e) =>
                        setChapters((c) =>
                          c.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 font-bold outline-none focus:border-blue-500"
                    />
                    <textarea
                      rows={2}
                      value={chapter.summary}
                      onChange={(e) =>
                        setChapters((c) =>
                          c.map((x, j) =>
                            j === i ? { ...x, summary: e.target.value } : x,
                          ),
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <label className="module-btn mt-2 cursor-pointer">
                      <Upload size={16} />
                      Upload Chapter PDF
                      <input 
                        type="file" 
                        accept="application/pdf,.pdf" 
                        hidden 
                        onChange={async (e) => {
                          const selected = e.target.files?.[0];
                          if (!selected) return;
                          const preview = await readFile(selected);
                          setChapters((c) =>
                            c.map((x, j) =>
                              j === i ? { ...x, file: { name: selected.name, preview } } : x,
                            ),
                          );
                        }}
                      />
                    </label>
                    {chapter.file && (
                      <p className="mt-2 text-xs font-medium text-emerald-600 truncate">
                        Uploaded: {chapter.file.name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded p-2 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowUp size={17} />
                    </button>
                    <button
                      disabled={i === chapters.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded p-2 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowDown size={17} />
                    </button>
                    <button
                      onClick={() =>
                        setChapters((c) => c.filter((_, j) => j !== i))
                      }
                      className="rounded p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          }
          rightPanel={
            <aside className="h-full rounded-2xl border bg-slate-200 p-4 block">
              <p className="mb-3 text-xs font-bold uppercase text-slate-600">
                Live Chapter Index Preview
              </p>
              <div className="min-h-[760px] bg-white p-8 shadow">
                <p className="text-center text-xs font-bold uppercase tracking-[.2em]">
                  District Survey Report
                </p>
                <h2 className="mt-4 border-b-2 pb-4 text-center text-xl font-bold uppercase">
                  Table of Chapters
                </h2>
                <div className="mt-6 space-y-4">
                  {chapters.map((chapter, i) => (
                    <div key={i} className="border-b pb-3">
                      <p className="text-sm font-bold">{chapter.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {chapter.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          }
        />
      </div>
    </>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
