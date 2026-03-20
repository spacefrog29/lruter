import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import Papa from "papaparse";
import "./index.css";

import { TopBar } from "@/components/app/TopBar";
import { Sidebar } from "@/components/app/Sidebar";
import { ImportZone } from "@/components/app/ImportZone";
import { FilterRow } from "@/components/app/FilterRow";
import { SentenceGrid } from "@/components/app/SentenceGrid";
import { WorkspaceBar } from "@/components/app/WorkspaceBar";
import { Icon } from "@/components/app/Icon";

// ─────────────────────────────────────────────────────────────
// Sentence Picker — "Digital Curator" Editorial Design
//
// CSV import → sentence list → click to collect → copy/export
// ─────────────────────────────────────────────────────────────

function appendWithSmartSpace(prev: string, next: string): string {
  if (!prev) return next;
  const needsSpace = !(prev.endsWith(" ") || prev.endsWith("\n") || prev.endsWith("\t"));
  return prev + (needsSpace ? " " : "") + next;
}

export function App() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sentenceCount, setSentenceCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const hasData = sentences.length > 0;

  // ── CSV parsing ──────────────────────────────────────────
  const parseCsvFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);

    Papa.parse(file, {
      header: false,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = (results.data as any[])
            .map((row) => (Array.isArray(row) ? row : [row]))
            .map((arr: any[]) => arr.map((v) => (v == null ? "" : String(v))).join(","))
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);

          if (rows.length === 0) {
            setError("No sentences found in the file.");
            setSentences([]);
            setFiltered([]);
            setSelectedIndex(null);
            setEditorValue("");
            setSentenceCount(0);
            return;
          }
          setSentences(rows);
          setFiltered(rows);
          setSelectedIndex(null);
          setEditorValue("");
          setSentenceCount(0);
        } catch (e: any) {
          console.error(e);
          setError("Couldn't parse that file. Please check the format.");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Failed to read the file.");
      },
    });
  }, []);

  const onFilePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) parseCsvFile(f);
    },
    [parseCsvFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const f = e.dataTransfer.files?.[0];
      if (f && (f.name.toLowerCase().endsWith(".csv") || f.name.toLowerCase().endsWith(".txt"))) {
        parseCsvFile(f);
      } else {
        setError("Please drop a .csv or .txt file.");
      }
    },
    [parseCsvFile]
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ── Actions ──────────────────────────────────────────────
  const onSentenceClick = (idx: number) => {
    setSelectedIndex(idx);
    setEditorValue((prev) => appendWithSmartSpace(prev, filtered[idx] ?? ""));
    setSentenceCount((c) => c + 1);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editorValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Clipboard copy failed — you can select and copy manually.");
    }
  };

  const clearAll = () => {
    setSentences([]);
    setFiltered([]);
    setSelectedIndex(null);
    setEditorValue("");
    setFileName(null);
    setQuery("");
    setError(null);
    setSentenceCount(0);
  };

  const onFilter = useCallback(
    (val: string) => {
      setQuery(val);
      if (!val) {
        setFiltered(sentences);
        return;
      }
      const q = val.toLowerCase();
      setFiltered(sentences.filter((s) => s.toLowerCase().includes(q)));
      setSelectedIndex(null);
    },
    [sentences]
  );

  // ── Derived state ────────────────────────────────────────
  const wordCount = useMemo(() => {
    if (!editorValue.trim()) return 0;
    return editorValue.trim().split(/\s+/).length;
  }, [editorValue]);

  // ── Self-test (dev only) ─────────────────────────────────
  useEffect(() => {
    try {
      const a = appendWithSmartSpace;
      console.assert(a("", "Hello") === "Hello", "Test 1: empty prev");
      console.assert(a("Hello", "World") === "Hello World", "Test 2: add space");
      console.assert(a("Hello ", "World") === "Hello World", "Test 3: keep space");
      console.assert(a("Hello\n", "World") === "Hello\nWorld", "Test 4: newline");
      console.assert(a("Hello\t", "World") === "Hello\tWorld", "Test 5: tab");
      console.info("Runtime tests passed: 5/5");
    } catch (err) {
      console.warn("A runtime test failed", err);
    }
  }, []);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      <TopBar fileName={fileName} />

      <Sidebar onImportClick={() => fileInputRef.current?.click()} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={onFilePick}
      />

      {/* Main content area — offset for sidebar on desktop */}
      <main className="md:ml-64 pt-[6.5rem] pb-16 px-8 lg:px-12">
        <div className="max-w-[56rem]">
          <ImportZone
            dropRef={dropRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectFile={() => fileInputRef.current?.click()}
            fileName={fileName}
          />

          <FilterRow
            query={query}
            onFilter={onFilter}
            visibleCount={filtered.length}
            totalCount={sentences.length}
            hasData={hasData}
          />

          <SentenceGrid
            sentences={filtered}
            selectedIndex={selectedIndex}
            onSentenceClick={onSentenceClick}
            hasData={hasData}
          />

          {/* Error display */}
          {error && (
            <div className="mt-8 text-sm text-error bg-error-container rounded-lg p-4 flex items-center gap-3">
              <Icon name="error" className="text-error" />
              {error}
            </div>
          )}

          {/* Workspace — inline below the grid */}
          <WorkspaceBar
            editorValue={editorValue}
            onEditorChange={setEditorValue}
            wordCount={wordCount}
            sentenceCount={sentenceCount}
            onCopy={copyToClipboard}
            onExport={copyToClipboard}
            onReimport={() => fileInputRef.current?.click()}
            onClearAll={clearAll}
            copied={copied}
            hasData={hasData}
          />
        </div>
      </main>
    </div>
  );
}

// ── Mount ────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
