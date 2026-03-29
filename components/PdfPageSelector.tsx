"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  file: File;
  selectedPages: number[];
  onChange: (pages: number[]) => void;
  maxSelectablePages?: number;
}

export function PdfPageSelector({ file, selectedPages, onChange, maxSelectablePages = 15 }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPage, setExpandedPage] = useState<number | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    setError("Failed to load PDF.");
    console.error(error);
  }

  const togglePage = (pageIndex: number) => {
    if (selectedPages.includes(pageIndex)) {
      onChange(selectedPages.filter((p) => p !== pageIndex));
    } else {
      if (maxSelectablePages && selectedPages.length >= maxSelectablePages) {
        alert(`You can only select up to ${maxSelectablePages} pages.`);
        return;
      }
      const newSelection = [...selectedPages, pageIndex].sort((a, b) => a - b);
      onChange(newSelection);
    }
  };

  const selectAll = () => {
    if (numPages) {
       if (maxSelectablePages && numPages > maxSelectablePages) {
         alert(`Document has ${numPages} pages which exceeds the maximum allowed selection (${maxSelectablePages}). Please select pages manually.`);
         return;
       }
       const all = Array.from({ length: numPages }, (_, i) => i);
       onChange(all);
    }
  }

  return (
    <div className="mt-2 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Select pages</h3>
        <div className="space-x-3">
            <button 
              type="button" 
              onClick={selectAll}
              className="text-xs font-medium text-primary hover:underline hover:opacity-80 disabled:opacity-50"
              disabled={numPages === null}
            >
              Select All
            </button>
            <button 
              type="button" 
              onClick={() => onChange([])}
              className="text-xs font-medium text-muted-foreground hover:underline hover:opacity-80 disabled:opacity-50"
              disabled={selectedPages.length === 0}
            >
              Clear
            </button>
        </div>
      </div>
      
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      
      <div className="relative overflow-x-auto whitespace-nowrap pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="inline-flex gap-4 min-h-[150px] items-center"
          loading={
            <div className="animate-pulse flex gap-4">
               {[1,2,3].map(i => <div key={i} className="w-[100px] h-[140px] bg-muted rounded-md" />)}
            </div>
          }
        >
          {numPages !== null &&
            Array.from(new Array(numPages), (_, index) => {
              const pageNumber = index + 1;
              const isSelected = selectedPages.includes(index);
              
              return (
                <div 
                  key={`page_${pageNumber}`} 
                  onClick={() => togglePage(index)}
                  onDoubleClick={() => setExpandedPage(pageNumber)}
                  className={`
                    cursor-pointer inline-block shrink-0 relative transition-all rounded-md overflow-hidden p-1 select-none
                    ${isSelected ? 'ring-2 ring-primary bg-primary/10 opacity-100' : 'ring-1 ring-border hover:ring-foreground/30 hover:bg-muted opacity-80 hover:opacity-100'}
                  `}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={100}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-sm rounded bg-white overflow-hidden pointer-events-none"
                  />
                  <div className="absolute top-2 right-2 z-10 pointer-events-none">
                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center bg-background shadow-sm transition-colors
                        ${isSelected ? 'border-primary text-primary' : 'border-muted-foreground/30 text-transparent'}`}
                     >
                        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                     </div>
                  </div>
                  <div className="text-center text-xs mt-2 font-medium text-foreground pointer-events-none">
                    Page {pageNumber}
                  </div>
                </div>
              );
            })}
        </Document>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Selected: <span className="font-medium text-foreground">{selectedPages.length}</span> {maxSelectablePages ? `/ ${maxSelectablePages} (Max)` : ''} pages
      </p>

      {expandedPage !== null && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm"
          role="dialog"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedPage(null);
          }}
        >
          <div className="relative max-h-[90vh] max-w-[95vw] overflow-y-auto rounded-lg bg-card shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-3">
               <h3 className="font-medium text-foreground text-sm">Preview: Page {expandedPage}</h3>
               <button
                 type="button"
                 onClick={() => setExpandedPage(null)}
                 className="rounded-md p-1.5 text-xs font-medium border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
               >
                 Close
               </button>
            </div>
            <div className="p-4 bg-muted/20">
              <Document file={file}>
                <Page
                  pageNumber={expandedPage}
                  width={Math.min(typeof window !== "undefined" ? window.innerWidth * 0.85 : 800, 1200)}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="mx-auto bg-white shadow-sm"
                />
              </Document>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
