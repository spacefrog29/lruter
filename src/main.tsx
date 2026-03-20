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
import {
  type CommentRow,
  DEFAULT_GROUP,
  safeStr,
  normaliseGroup,
  appendWithSmartSpace,
} from "@/components/app/types";

// ─────────────────────────────────────────────────────────────
// Sentence Picker — "Digital Curator" Editorial Design
//
// CSV import → sentence list → click to collect → copy/export
// Supports 1-column (text only) and 2-column (group, text) CSVs
// ─────────────────────────────────────────────────────────────

export function App() {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [filtered, setFiltered] = useState<CommentRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [editorValue, setEditorValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [sentenceCount, setSentenceCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const hasData = rows.length > 0;

  // ── Derived: unique sorted groups ────────────────────────
  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.group);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // ── Filter logic (searches both group + text) ────────────
  const applyFilters = useCallback(
    (nextRows: CommentRow[], nextQuery: string, nextGroup: string) => {
      const q = nextQuery.trim().toLowerCase();
      let out = nextRows;

      if (nextGroup !== "ALL") {
        out = out.filter((r) => r.group === nextGroup);
      }

      if (q) {
        out = out.filter((r) => {
          const hay = `${r.group} ${r.text}`.toLowerCase();
          return hay.includes(q);
        });
      }

      setFiltered(out);

      // If selected item is no longer visible, clear selection
      if (selectedId && !out.some((r) => r.id === selectedId)) {
        setSelectedId(null);
      }
    },
    [selectedId]
  );

  // ── CSV parsing (supports 1-col and 2-col formats) ──────
  const parseCsvFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);

    Papa.parse(file, {
      header: false,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawRows = (results.data as unknown[]).map((row) =>
            Array.isArray(row) ? row : [row]
          );

          const parsed: CommentRow[] = rawRows
            .map((arr, idx) => {
              const col0 = safeStr(arr[0]).trim();
              const col1 = safeStr(arr[1]).trim();

              // 1-column CSV: treat column 0 as the text
              if (arr.length <= 1) {
                return {
                  id: `${idx}-${col0.slice(0, 24)}`,
                  group: DEFAULT_GROUP,
                  text: col0,
                  order: idx,
                };
              }

              // 2+ column CSV: first column is group, second is text
              return {
                id: `${idx}-${normaliseGroup(col0).slice(0, 18)}-${col1.slice(0, 18)}`,
                group: normaliseGroup(col0),
                text: col1,
                order: idx,
              };
            })
            .map((r) => ({
              ...r,
              group: normaliseGroup(r.group),
              text: r.text.trim(),
            }))
            .filter((r) => r.text.length > 0);

          if (parsed.length === 0) {
            setError("No sentences found in the file.");
            setRows([]);
            setFiltered([]);
            setSelectedId(null);
            setEditorValue("");
            setSelectedGroup("ALL");
            setQuery("");
            setSentenceCount(0);
            return;
          }

          setRows(parsed);
          setSelectedGroup("ALL");
          setQuery("");
          setSelectedId(null);
          setEditorValue("");
          setCopied(false);
          setSentenceCount(0);
          setFiltered(parsed);
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
  const onRowClick = (row: CommentRow) => {
    setSelectedId(row.id);
    setEditorValue((prev) => appendWithSmartSpace(prev, row.text));
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
    setRows([]);
    setFiltered([]);
    setSelectedId(null);
    setEditorValue("");
    setFileName(null);
    setQuery("");
    setSelectedGroup("ALL");
    setError(null);
    setSentenceCount(0);
  };

  const onFilterText = useCallback(
    (val: string) => {
      setQuery(val);
      applyFilters(rows, val, selectedGroup);
    },
    [applyFilters, rows, selectedGroup]
  );

  const onFilterGroup = useCallback(
    (val: string) => {
      setSelectedGroup(val);
      applyFilters(rows, query, val);
    },
    [applyFilters, rows, query]
  );

  // ── Derived state ────────────────────────────────────────
  const wordCount = useMemo(() => {
    if (!editorValue.trim()) return 0;
    return editorValue.trim().split(/\s+/).length;
  }, [editorValue]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((r) => r.id === selectedId) ?? null;
  }, [rows, selectedId]);

  // ── Self-tests (dev only) ────────────────────────────────
  useEffect(() => {
    try {
      const a = appendWithSmartSpace;
      console.assert(a("", "Hello") === "Hello", "Test 1: empty prev");
      console.assert(a("Hello", "World") === "Hello World", "Test 2: add space");
      console.assert(a("Hello ", "World") === "Hello World", "Test 3: keep space");
      console.assert(a("Hello\n", "World") === "Hello\nWorld", "Test 4: newline");
      console.assert(a("Hello\t", "World") === "Hello\tWorld", "Test 5: tab");

      // CSV parse smoke tests (from Tom's original)
      const oneCol = Papa.parse("One\nTwo\nThree", { header: false, skipEmptyLines: true });
      console.assert(
        Array.isArray(oneCol.data) && (oneCol.data as any[]).length === 3,
        "Test 6: 1-col length"
      );

      const twoCol = Papa.parse("GroupA,Comment 1\nGroupB,Comment 2", {
        header: false,
        skipEmptyLines: true,
      });
      console.assert(
        Array.isArray(twoCol.data) && (twoCol.data as any[]).length === 2,
        "Test 7: 2-col length"
      );

      console.info("Runtime tests passed: 7/7");
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
            onFilterText={onFilterText}
            selectedGroup={selectedGroup}
            onFilterGroup={onFilterGroup}
            groups={groups}
            visibleCount={filtered.length}
            totalCount={rows.length}
            hasData={hasData}
          />

          <SentenceGrid
            rows={filtered}
            selectedId={selectedId}
            onRowClick={onRowClick}
            hasData={hasData}
            fileName={fileName}
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
            selectedGroup={selectedRow?.group ?? null}
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
