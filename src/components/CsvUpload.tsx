"use client";
import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface CsvUploadProps {
  onSuccess?: (imported: number) => void;
}

export default function CsvUpload({ onSuccess }: CsvUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/spend", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setResult(json.data);
      onSuccess?.(json.data.imported);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-brand-400 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
            <p className="text-sm text-slate-600">Processing CSV...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
              <Upload className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <p className="font-medium text-slate-700">Drop your CSV file here</p>
              <p className="text-sm text-slate-400 mt-1">or click to browse · Supports spend record imports</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
            <CheckCircle2 className="h-4 w-4" />
            Import complete
          </div>
          <p className="text-sm text-green-600">{result.imported} records imported successfully</p>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-orange-600">{result.errors.length} rows skipped:</p>
              <ul className="mt-1 space-y-0.5">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i} className="text-xs text-orange-500">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <p className="text-xs font-medium text-slate-600">Expected CSV columns:</p>
        </div>
        <code className="text-xs text-slate-500 block">
          vendor_id, amount_usd, category, department, period_start, period_end, invoice_ref
        </code>
      </div>
    </div>
  );
}