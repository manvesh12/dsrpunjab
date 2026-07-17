import { Download, Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import jsPDF from "jspdf";
import { useLocalDraft } from "../../hooks/useLocalDraft";

type UploadRecord = { name: string; preview?: string };
type Chapter = { name: string; summary: string; file?: UploadRecord };

function UploadedPreview({ src, title }: { src: string; title: string }) {
  if (!src) return null;
  return src.startsWith("data:image") ? (
    <div className="flex flex-col items-center mb-12">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <img
        src={src}
        alt={`Uploaded preview for ${title}`}
        className="w-full border border-slate-200 shadow-md"
      />
    </div>
  ) : (
    <div className="flex flex-col items-center mb-12 w-full">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <iframe
        title={`Uploaded PDF preview for ${title}`}
        src={src}
        className="w-full h-[1400px] border border-slate-200 shadow-md bg-white"
      />
    </div>
  );
}

export default function ReportPreviewPage() {
  const { projectId = "default" } = useParams();
  
  const [cover] = useLocalDraft<UploadRecord | null>(`project-${projectId}:cover`, null);
  const [certificate] = useLocalDraft<UploadRecord | null>(`project-${projectId}:certificate`, null);
  const [contents] = useLocalDraft<UploadRecord | null>(`project-${projectId}:contents`, null);
  const [preface] = useLocalDraft<UploadRecord | null>(`project-${projectId}:preface`, null);
  const [chapters] = useLocalDraft<Chapter[]>("chapters-exact", []);

  const downloadFinalPdf = () => {
    // Basic placeholder for now, since generating a combined PDF from base64 files requires heavy PDF merging logic
    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("DISTRICT SURVEY REPORT", 105, 25, { align: "center" });
    pdf.setFontSize(10);
    pdf.text("Government of Punjab • 2025-26", 105, 33, { align: "center" });
    pdf.text("Note: PDF combination of uploaded files is a backend feature.", 105, 50, { align: "center" });
    pdf.save(`DSR-Final-Report-${projectId}.pdf`);
  };

  const hasContent = cover?.preview || certificate?.preview || contents?.preview || preface?.preview || chapters.some(c => c.file?.preview);

  return (
    <>
      <PageHeader
        title="Live Report Preview"
        description={`Continuous compiled preview of all uploaded documents for project #${projectId}`}
        action={
          <div className="flex gap-2">
            <button className="module-btn" onClick={() => window.print()}>
              <Printer size={17} />
              Print
            </button>
            <button className="module-btn-primary" onClick={downloadFinalPdf}>
              <Download size={17} />
              Download Final PDF
            </button>
          </div>
        }
      />
      
      <main className="rounded-2xl border border-slate-200 bg-slate-100 p-4 md:p-8 overflow-y-auto">
        <article className="mx-auto max-w-[1200px] w-full bg-white shadow-xl min-h-screen py-16 px-4 md:px-12 flex flex-col items-center">
          {!hasContent ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
              <p className="text-slate-500 max-w-md text-lg">
                No documents have been uploaded yet. Please upload files in the Front Matter and Chapters sections to see the continuous live preview here.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-16">
              {cover?.preview && <UploadedPreview src={cover.preview} title="Cover Page" />}
              {certificate?.preview && <UploadedPreview src={certificate.preview} title="Certificate of Compliance" />}
              {contents?.preview && <UploadedPreview src={contents.preview} title="Content Page" />}
              {preface?.preview && <UploadedPreview src={preface.preview} title="Preface" />}
              
              {chapters.map((chapter, i) => (
                chapter.file?.preview ? (
                  <UploadedPreview 
                    key={i} 
                    src={chapter.file.preview} 
                    title={`Chapter ${i + 1}: ${chapter.name}`} 
                  />
                ) : null
              ))}
              
              <div className="w-full border-t-2 border-dashed border-slate-300 mt-12 pt-12 flex flex-col items-center text-slate-400">
                <p>End of Report Document</p>
              </div>
            </div>
          )}
        </article>
      </main>
    </>
  );
}
