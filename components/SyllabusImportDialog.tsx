"use client";

import { useState } from "react";
import type { SyllabusParseItem } from "@/lib/syllabus-api";
import type { GradeItemKind } from "@/lib/types";
import { useCoursesStore } from "@/lib/store";
import { fetchWithCompression } from "@/lib/http";
import { Lock } from "lucide-react";
import dynamic from "next/dynamic";

const PdfPageSelector = dynamic(() => import("./PdfPageSelector").then((m) => m.PdfPageSelector), { ssr: false });

type Props = {
  courseId: string;
  existingItemCount: number;
};

const KIND_LABEL: Record<GradeItemKind, string> = {
  assignment: "Assignment",
  test: "Test",
  other: "Other",
};

export function SyllabusImportDialog({ courseId, existingItemCount }: Props) {
  const importGradeItems = useCoursesStore((s) => s.importGradeItems);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"file" | "text">("text");
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SyllabusParseItem[] | null>(null);
  const [warnings, setWarnings] = useState<string[] | undefined>(undefined);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [maxPages, setMaxPages] = useState<number>(10);
  const [pdfMode, setPdfMode] = useState<"crop" | "select">("crop");
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const reset = () => {
    setPastedText("");
    setFile(null);
    setError(null);
    setPreview(null);
    setWarnings(undefined);
    setMode("append");
    setTab("text");
    setPdfMode("crop");
    setSelectedPages([]);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const parseSyllabus = async () => {
    const adminToken = localStorage.getItem("admin-token");
    const lastParseDate = localStorage.getItem("last-syllabus-parse");
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    
    // We store an array of timestamps in localStorage loosely matching the server logic for better UX
    let parseHistory: number[] = [];
    try {
      parseHistory = JSON.parse(localStorage.getItem("parse-history") || "[]");
    } catch { parseHistory = []; }
    
    const now = Date.now();
    const recentParses = parseHistory.filter(t => now - t < ONE_DAY_MS);

    if (!adminToken && recentParses.length >= 2) {
      setError("Daily limit reached. You can only perform two syllabus parses per day.");
      return;
    }

    setError(null);
    setPreview(null);
    setWarnings(undefined);
    setLoading(true);
    try {
      const form = new FormData();
      if (tab === "file" && file) {
        let fileToUpload = file;
        if (file.name.toLowerCase().endsWith(".pdf")) {
          try {
            const { PDFDocument } = await import("pdf-lib");
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            let pagesToCopy: number[] = [];

            if (pdfMode === "crop") {
              if (maxPages > pageCount) {
                setLoading(false);
                setError(`Chosen max pages (${maxPages}) exceeds the total document pages (${pageCount}).`);
                return;
              }
              if (pageCount > maxPages) {
                pagesToCopy = Array.from({ length: maxPages }, (_, i) => i);
              }
            } else if (pdfMode === "select") {
              if (selectedPages.length === 0) {
                setLoading(false);
                setError("Please select at least one page.");
                return;
              }
              if (selectedPages.length > pageCount) {
                setLoading(false);
                setError("Invalid page selection.");
                return;
              }
              if (selectedPages.length < pageCount) {
                pagesToCopy = selectedPages;
              }
            }

            if (pagesToCopy.length > 0) {
              const newPdf = await PDFDocument.create();
              const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
              copiedPages.forEach((page) => newPdf.addPage(page));
              
              const pdfBytes = await newPdf.save();
              const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
              fileToUpload = new File([pdfBlob], file.name, { type: "application/pdf" });
            }
          } catch (e) {
            console.error("Failed to process PDF locally. Falling back to original file.", e);
          }
        }
        form.append("file", fileToUpload);
      } else if (tab === "text" && pastedText.trim()) {
        form.append("text", pastedText.trim());
      } else {
        setError(tab === "file" ? "Choose a file." : "Paste syllabus text.");
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = {};
      const token = localStorage.getItem("admin-token");
      if (token) {
        headers["x-admin-token"] = token;
      }

      const res = await fetchWithCompression("/api/syllabus/parse", {
        method: "POST",
        headers,
        body: form,
      });
      const data = (await res.json()) as {
        items?: SyllabusParseItem[];
        warnings?: string[];
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Request failed.");
        setLoading(false);
        return;
      }

      if (!data.items) {
        setError("Unexpected response.");
        setLoading(false);
        return;
      }

      setPreview(data.items);
      setWarnings(data.warnings);
      
      // Update local history for UX
      const currentHistory = JSON.parse(localStorage.getItem("parse-history") || "[]");
      currentHistory.push(Date.now());
      localStorage.setItem("parse-history", JSON.stringify(currentHistory));
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Network error.");
      }
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!preview?.length) return;
    if (
      mode === "replace" &&
      existingItemCount > 0 &&
      !window.confirm(
        `Replace all ${existingItemCount} existing row(s) with ${preview.length} imported row(s)?`,
      )
    ) {
      return;
    }
    importGradeItems(
      courseId,
      preview.map((i) => ({
        name: i.name,
        kind: i.kind,
        weight: i.weightPercent,
      })),
      mode,
    );
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
      >
        Import from syllabus
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-labelledby="syllabus-import-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id="syllabus-import-title" className="text-lg font-semibold text-foreground">
                Import from syllabus
              </h2>
              <button
                type="button"
                className="relative z-10 p-2 text-muted-foreground hover:text-foreground opacity-30 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center rounded-md hover:bg-muted"
                onClick={() => {
                  const token = window.prompt("Enter admin token to bypass limits:");
                  if (token !== null) {
                    if (token.trim()) {
                      localStorage.setItem("admin-token", token.trim());
                      alert("Admin token saved.");
                    } else {
                      localStorage.removeItem("admin-token");
                      alert("Admin token removed.");
                    }
                  }
                }}
                title="Admin Access"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Max two syllabus parses per day.
            </p>

            <div className="mt-4 inline-flex rounded-lg border border-border bg-muted/30 p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setTab("text")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  tab === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Paste text
              </button>
              <button
                type="button"
                onClick={() => setTab("file")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  tab === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Upload file
              </button>
            </div>

            {tab === "text" ? (
              <label className="mt-4 block text-sm font-medium text-foreground">
                Syllabus text
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    setError(null);
                  }}
                  rows={8}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
                  placeholder="Paste the grading policy section…"
                />
              </label>
            ) : (
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-foreground">
                  File (PDF, Word, PowerPoint, HTML, text, or images)
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.html,.htm,.png,.jpg,.jpeg,.gif,.webp"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      setError(null);
                      setSelectedPages([]);
                    }}
                    className="mt-2 block w-full cursor-pointer text-base font-bold text-foreground file:mr-4 file:cursor-pointer file:border-3 file:border-solid file:border-foreground file:bg-card file:px-4 file:py-2 file:text-base file:font-black file:uppercase file:text-foreground hover:file:translate-x-[2px] hover:file:translate-y-[2px] file:transition-all hover:file:bg-accent hover:file:text-accent-foreground"
                  />
                </label>
                {file && file.name.toLowerCase().endsWith(".pdf") && (
                  <div className="mt-4 space-y-4 rounded-md border border-border p-4 bg-muted/10">
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium text-foreground mb-2">PDF scanning mode</legend>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="pdf-mode"
                          checked={pdfMode === "crop"}
                          onChange={() => setPdfMode("crop")}
                        />
                        <span className="text-sm">Scan the first few pages</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="pdf-mode"
                          checked={pdfMode === "select"}
                          onChange={() => setPdfMode("select")}
                        />
                        <span className="text-sm">Manually select pages</span>
                      </label>
                    </fieldset>

                    {pdfMode === "crop" ? (
                      <label className="block text-sm font-medium text-foreground pt-3 border-t border-border mt-3">
                        Max pages to scan
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={maxPages}
                          onChange={(e) => {
                            setMaxPages(parseInt(e.target.value) || 10);
                            setError(null);
                          }}
                          className="mt-1 block w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Choose how many pages are uploaded to keep the size small.
                        </p>
                      </label>
                    ) : (
                      <div className="pt-3 border-t border-border mt-3">
                        <PdfPageSelector
                          file={file}
                          selectedPages={selectedPages}
                          onChange={setSelectedPages}
                          maxSelectablePages={15}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {error ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void parseSyllabus()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Parsing…" : "Parse syllabus"}
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>

            {preview !== null && preview.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No graded items were extracted. Try a clearer grading section, another format, or
                paste more text.
              </p>
            ) : null}

            {preview && preview.length > 0 ? (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">Preview</h3>
                {warnings?.length ? (
                  <ul className="mt-2 list-inside list-disc text-sm text-amber-700 dark:text-amber-400">
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Weight (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={`${row.name}-${idx}`} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 text-foreground">{row.name}</td>
                          <td className="px-3 py-2 text-foreground">{KIND_LABEL[row.kind]}</td>
                          <td className="px-3 py-2 tabular-nums text-foreground">
                            {row.weightPercent.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <fieldset className="mt-4 space-y-2">
                  <legend className="text-sm font-medium text-foreground">Import mode</legend>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="import-mode"
                      checked={mode === "append"}
                      onChange={() => setMode("append")}
                    />
                    <span className="text-sm">Append to existing rows</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="import-mode"
                      checked={mode === "replace"}
                      onChange={() => setMode("replace")}
                    />
                    <span className="text-sm">Replace all existing rows</span>
                  </label>
                </fieldset>

                <button
                  type="button"
                  onClick={apply}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Apply to course
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
