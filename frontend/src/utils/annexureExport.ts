import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { EditorColumn } from "../components/ui/ModuleEditor";

export type AnnexureSnapshot = {
  title: string;
  columns: EditorColumn[];
  rows: Record<string, string>[];
  attachments?: string[];
};

const safeName = (value: string) => value.replace(/[\\/?*[\]:]/g, " ").trim();

export function exportAnnexureExcel(
  title: string,
  snapshots: AnnexureSnapshot[],
) {
  const workbook = XLSX.utils.book_new();
  snapshots.forEach((snapshot, index) => {
    const data = [
      snapshot.columns.map((column) => column.label),
      ...snapshot.rows.map((row) =>
        snapshot.columns.map((column) => row[column.key] ?? ""),
      ),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet["!cols"] = snapshot.columns.map((column) => ({
      wch: Math.min(45, Math.max(14, column.label.length + 3)),
    }));
    sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    const base = safeName(snapshot.title).slice(0, 25) || `Table ${index + 1}`;
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      `${index + 1}-${base}`.slice(0, 31),
    );
    if (snapshot.attachments?.length) {
      const attachmentSheet = XLSX.utils.aoa_to_sheet([
        ["Attachments for", snapshot.title],
        ...snapshot.attachments.map((name) => [name]),
      ]);
      XLSX.utils.book_append_sheet(
        workbook,
        attachmentSheet,
        `${index + 1}-Files`.slice(0, 31),
      );
    }
  });
  if (!snapshots.length)
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([[title]]),
      "Annexure",
    );
  XLSX.writeFile(workbook, `${safeName(title).replaceAll(" ", "-")}.xlsx`);
}

export function exportAnnexurePdf(
  title: string,
  snapshots: AnnexureSnapshot[],
) {
  const document = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  snapshots.forEach((snapshot, index) => {
    if (index) document.addPage("a4", "landscape");
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text("GOVERNMENT OF PUNJAB", 148.5, 12, { align: "center" });
    document.setFontSize(15);
    document.text(title.toUpperCase(), 148.5, 21, {
      align: "center",
      maxWidth: 270,
    });
    document.setFontSize(11);
    document.text(snapshot.title, 14, 31, { maxWidth: 269 });
    autoTable(document, {
      startY: 36,
      head: [snapshot.columns.map((column) => column.label)],
      body: snapshot.rows.map((row) =>
        snapshot.columns.map((column) => row[column.key] ?? ""),
      ),
      theme: "grid",
      styles: {
        fontSize: snapshot.columns.length > 10 ? 4.5 : 6.5,
        cellPadding: 0.8,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: "bold",
      },
      margin: { top: 14, right: 10, bottom: 14, left: 10 },
      tableWidth: 277,
      didDrawPage: ({ pageNumber }) => {
        document.setFontSize(7);
        document.setTextColor(90);
        document.text(
          `District Survey Report • ${title} • Page ${pageNumber}`,
          148.5,
          203,
          { align: "center" },
        );
      },
    });
    if (snapshot.attachments?.length) {
      const finalY =
        (document as unknown as { lastAutoTable?: { finalY: number } })
          .lastAutoTable?.finalY ?? 42;
      document.setFontSize(7);
      document.setTextColor(70);
      document.text(
        `Attached files: ${snapshot.attachments.join(", ")}`,
        12,
        Math.min(finalY + 8, 198),
        { maxWidth: 270 },
      );
    }
  });
  if (!snapshots.length) document.text(title, 148.5, 25, { align: "center" });
  document.save(`${safeName(title).replaceAll(" ", "-")}.pdf`);
}
