import React, { useState, useRef } from "react";
import { UploadCloud, FileType, X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface Step2UploadProps {
  onUploadComplete: () => void;
  onCancel: () => void;
}

export default function Step2Upload({ onUploadComplete, onCancel }: Step2UploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const simulateUpload = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadStatus("uploading");
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus("success");
          setTimeout(() => {
            onUploadComplete();
          }, 1000);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        simulateUpload(droppedFile);
      } else {
        setUploadStatus("error");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      simulateUpload(e.target.files[0]);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upload DSR Document</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Supported formats: PDF (Searchable or Scanned)</p>
        </div>
        <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
          Cancel
        </button>
      </div>

      {!file || uploadStatus === "error" ? (
        <div
          className={`relative flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
              : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            onChange={handleChange}
          />
          
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            <UploadCloud size={40} />
          </div>
          
          <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            Drag & drop your PDF here
          </h3>
          <p className="mb-6 text-center text-slate-500 dark:text-slate-400">
            or click to browse from your computer.<br/>
            Maximum file size: 2 GB
          </p>

          {uploadStatus === "error" && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle size={16} />
              Invalid file format. Please upload a PDF file.
            </div>
          )}

          <div className="flex gap-4">
            <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              Browse Files
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <FileType size={24} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="truncate font-semibold text-slate-900 dark:text-white">{file.name}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {uploadStatus === "success" ? "Complete" : "Uploading..."}
              </p>
            </div>
            {uploadStatus !== "success" && (
              <button onClick={resetUpload} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="relative mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`absolute left-0 top-0 h-full transition-all duration-300 ${uploadStatus === "success" ? "bg-emerald-500" : "bg-blue-600"}`}
              style={{ width: `${Math.min(uploadProgress, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm font-medium">
            <span className={uploadStatus === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}>
              {uploadStatus === "success" ? "Upload complete" : `${Math.min(uploadProgress, 100)}%`}
            </span>
            <span className="text-slate-500">{Math.min(uploadProgress, 100)} / 100%</span>
          </div>

          {uploadStatus === "uploading" && (
             <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                  Pause
                </button>
             </div>
          )}

          {uploadStatus === "success" && (
             <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-semibold">Ready for parsing</span>
                </div>
                <div className="flex gap-3">
                   <button onClick={resetUpload} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                    <RefreshCw size={16} />
                    Replace File
                  </button>
                  <button onClick={onUploadComplete} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500">
                    Begin Parsing
                  </button>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
