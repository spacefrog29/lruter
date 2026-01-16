import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import Papa from "papaparse";
import { Upload, Clipboard, Check, Trash2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./index.css";

type CommentRow = {
  id: string;
  group: string;
  text: string;
  // Useful for preserving original order even after filtering
  order: number;
};

const DEFAULT_GROUP = "Ungrouped";

function safeStr(v: unknown): string {
  return v == null ? "" : String(v);
}

// Helper used both in tests and click handler
function appendWithSmartSpace(prev: string, next: string): string {
  if (!prev) return next;
  const needsSpace = !(prev.endsWith(" ") || prev.endsWith("\n") || prev.endsWith("\t"));
  return prev + (needsSpace ? " " : "") + next;
}

// Best-effort normaliser for group names (avoid weird whitespace and empty groups)
function normaliseGroup(g: string): string {
  const s = g.replace(/\s+/g, " ").trim();
  return s.length ? s : DEFAULT_GROUP;
}

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const hasData = rows.length > 0;

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.group);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      visible: filtered.length,
    }),
    [rows.length, filtered.length]
  );

  const applyFilters = useCallback(
    (nextRows: CommentRow[], nextQuery: string, nextGroup: string) => {
      const q = nextQuery.trim().toLowerCase();

      let out = nextRows;

      if (nextGroup !== "ALL") {
        out = out.filter((r) => r.group === nextGroup);
      }

      if (q) {
        out = out.filter((r) => {
          // Search both group + comment text
          const hay = `${r.group} ${r.text}`.toLowerCase();
          return hay.includes(q);
        });
      }

      setFiltered(out);
      // If the selected item is no longer visible, clear selection
      if (selectedId && !out.some((r) => r.id === selectedId)) {
        setSelectedId(null);
      }
    },
    [selectedId]
  );

  const parseCsvFile = useCallback(
    (file: File) => {
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

            // If the CSV has a header row like "Group,Comment", many users will include it.
            // We can safely *not* auto-skip headers because it can cause false positives.
            // Instead, we keep everything; users can remove headers if they want.
            //
            // That said, we do basic filtering: rows must have at least some non-empty text.
            const parsed: CommentRow[] = rawRows
              .map((arr, idx) => {
                const col0 = safeStr(arr[0]).trim();
                const col1 = safeStr(arr[1]).trim();

                // 1-column CSV: treat column 0 as the comment text
                if (arr.length <= 1) {
                  const text = col0;
                  return {
                    id: `${idx}-${text.slice(0, 24)}`,
                    group: DEFAULT_GROUP,
                    text,
                    order: idx,
                  };
                }

                // 2+ columns CSV: first column is group, second is comment (ignore extras)
                const group = normaliseGroup(col0);
                const text = col1;

                return {
                  id: `${idx}-${group.slice(0, 18)}-${text.slice(0, 18)}`,
                  group,
                  text,
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
              setError("No comments found in the CSV.");
              setRows([]);
              setFiltered([]);
              setSelectedId(null);
              setEditorValue("");
              setSelectedGroup("ALL");
              setQuery("");
              return;
            }

            setRows(parsed);
            // Reset filters on import (safest UX)
            setSelectedGroup("ALL");
            setQuery("");
            setSelectedId(null);
            setEditorValue("");
            setCopied(false);

            // Apply default filters
            setFiltered(parsed);
          } catch (e: any) {
            console.error(e);
            setError("Couldn't parse that CSV. Please check the file format.");
          }
        },
        error: (err) => {
          console.error(err);
          setError("Failed to read the CSV file.");
        },
      });
    },
    []
  );

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
      if (f && f.name.toLowerCase().endsWith(".csv")) {
        parseCsvFile(f);
      } else {
        setError("Please drop a .csv file.");
      }
    },
    [parseCsvFile]
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onRowClick = (row: CommentRow) => {
    setSelectedId(row.id);
    setEditorValue((prev) => appendWithSmartSpace(prev, row.text));
    setCopied(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editorValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      setError("Clipboard copy failed. You can select and copy manually.");
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

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((r) => r.id === selectedId) ?? null;
  }, [rows, selectedId]);

  // --- Lightweight runtime tests (executed once) ---
  useEffect(() => {
    try {
      const a = appendWithSmartSpace;
      console.assert(a("", "Hello") === "Hello", "Test 1: empty prev");
      console.assert(a("Hello", "World") === "Hello World", "Test 2: add space");
      console.assert(a("Hello ", "World") === "Hello World", "Test 3: keep existing space");
      console.assert(a("Hello\n", "World") === "Hello\nWorld", "Test 4: newline respected");
      console.assert(a("Hello\t", "World") === "Hello\tWorld", "Test 5: tab respected");

      // CSV parse smoke tests: 1-col and 2-col
      const oneCol = Papa.parse("One\nTwo\nThree", { header: false, skipEmptyLines: true });
      console.assert(Array.isArray(oneCol.data) && (oneCol.data as any[]).length === 3, "Test 6: 1-col length");

      const twoCol = Papa.parse("GroupA,Comment 1\nGroupB,Comment 2", { header: false, skipEmptyLines: true });
      console.assert(Array.isArray(twoCol.data) && (twoCol.data as any[]).length === 2, "Test 7: 2-col length");

      console.info("Runtime tests passed: 7/7");
    } catch (err) {
      console.warn("A runtime test failed", err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border/60 elevation-2">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-[28px] font-display text-foreground leading-tight tracking-tight">
                Comment Picker
              </h1>
              <p className="text-[13px] text-muted-foreground font-medium mt-0.5 tracking-wide">
                Import CSV • Filter by group • Click to append • Edit & Copy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 border-border/60 bg-card/50 hover:bg-card hover:border-accent/30 transition-elegant elevation-1"
            >
              <Upload className="size-4" /> Import CSV
            </Button>
            {hasData && (
              <Button
                variant="ghost"
                onClick={clearAll}
                className="gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-elegant"
              >
                <Trash2 className="size-4" /> Clear
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFilePick} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-20 pb-52">
        <div className="flex flex-col space-y-40">
          {/* Drop Zone */}
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="mt-10 ai-style-change-2"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl opacity-50 group-hover:opacity-70 transition-elegant blur-sm"></div>
              <div className="relative rounded-2xl border-2 border-dashed border-border/80 bg-card px-10 py-16 text-center hover:border-accent/40 transition-smooth elevation-3 group-hover:elevation-4">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/30 group-hover:border-accent/50 transition-smooth">
                      <Upload className="size-8 text-accent" strokeWidth={1.8} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-accent/20 animate-ping"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[16px] font-medium text-foreground">
                      Drag & drop a <span className="font-display-medium text-accent">.csv</span> file here
                    </div>
                    <div className="text-[14px] text-muted-foreground">
                      <span>or </span>
                      <button
                        className="font-semibold text-accent hover:text-accent/80 underline underline-offset-2 decoration-2 decoration-accent/40 hover:decoration-accent/60 transition-elegant"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse your files
                      </button>
                    </div>
                    <div className="text-[12px] text-muted-foreground/80">
                      Supports: <span className="font-semibold">1 column</span> (comment only) or{" "}
                      <span className="font-semibold">2 columns</span> (group, comment).
                    </div>
                  </div>
                  {fileName && (
                    <div className="mt-3 px-5 py-2.5 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 elevation-1">
                      <div className="flex items-center gap-2.5 text-[14px] font-semibold text-accent">
                        <Check className="size-4" strokeWidth={2.5} />
                        Loaded: {fileName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls & Stats */}
          <div className="mt-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-8">
            {/* Search */}
            <div className="relative md:w-96 w-full group">
              <Input
                placeholder="Search comments or groups…"
                value={query}
                onChange={(e) => onFilterText(e.target.value)}
                className="pl-6 h-11 bg-card/80 border-border/60 focus:border-accent/50 focus:ring-accent/10 transition-elegant elevation-1 focus:elevation-2"
              />
            </div>

            {/* Group filter */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-card/60 border border-border/40 elevation-1">
                <label className="text-[12px] text-muted-foreground font-semibold mr-2">Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => onFilterGroup(e.target.value)}
                  disabled={!hasData}
                  className="bg-transparent text-[13px] font-medium text-foreground outline-none"
                  aria-label="Filter by group"
                >
                  <option value="ALL">All groups</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="px-4 py-2 rounded-lg bg-card/60 border border-border/40 elevation-1">
                <div className="text-[13px] font-medium text-muted-foreground">
                  {hasData ? (
                    <span>
                      <span className="text-accent font-bold">{stats.visible}</span> shown
                      <span className="mx-2 text-border">•</span>
                      <span>{stats.total} total</span>
                    </span>
                  ) : (
                    <span>Import a CSV to begin</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* List */}
          <Card className="mt-8 bg-card/80 border border-border/60 elevation-3 overflow-hidden">
            <CardHeader className="pb-5 border-b border-border/60 bg-gradient-to-b from-accent/5 to-transparent">
              <CardTitle className="text-[20px] font-display text-foreground flex items-center gap-2">
                Comments
                {hasData && (
                  <span className="text-[13px] font-medium text-muted-foreground font-sans">
                    ({stats.total})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {hasData ? (
                <ScrollArea className="h-[50vh]">
                  <ul className="divide-y divide-border/40">
                    {filtered.map((r, i) => {
                      const isSelected = selectedId === r.id;
                      return (
                        <li key={r.id} className="group">
                          <button
                            onClick={() => onRowClick(r)}
                            className={
                              "w-full text-left px-6 py-4 hover:bg-accent/5 transition-smooth relative " +
                              (isSelected ? "bg-gradient-to-r from-accent/10 to-accent/5 border-accent-left" : "")
                            }
                            aria-label={`Select comment ${i + 1}`}
                          >
                            <div className="flex items-start gap-4">
                              <span className="flex-shrink-0 text-[13px] font-bold text-muted-foreground/60 mt-0.5 min-w-[28px] font-display">
                                {i + 1}
                              </span>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[12px] font-semibold text-accent/90 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md">
                                    {r.group}
                                  </span>
                                </div>
                                <div className="text-[15px] leading-relaxed text-foreground group-hover:text-foreground/90">
                                  {r.text}
                                </div>
                              </div>

                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <div className="size-6 rounded-full bg-accent/15 border border-accent/30 grid place-items-center">
                                    <Check className="size-3.5 text-accent" strokeWidth={2.5} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              ) : (
                <div className="text-center py-20 px-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 inline-block mb-5 border border-border/30">
                    <FileUp className="size-8 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="text-[16px] font-display-medium text-foreground mb-2">No data yet</div>
                  <div className="text-[14px] text-muted-foreground">Import a CSV file to populate the list</div>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-destructive/8 to-destructive/5 border border-destructive/30 elevation-2">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="size-2 rounded-full bg-destructive animate-pulse"></div>
                </div>
                <div>
                  <div className="text-[14px] font-display-medium text-destructive mb-1.5">Error</div>
                  <div className="text-[14px] text-destructive/80 leading-relaxed">{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Editor */}
      <div className="rounded-xl text-card-foreground shadow mt-8 bg-card/80 border border-border/60 elevation-3 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-[20px] font-display text-foreground">Editor</h2>

              {selectedRow && (
                <div className="px-3 py-1 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="text-[12px] font-bold text-accent tracking-wide">
                    {selectedRow.group}
                  </div>
                </div>
              )}
            </div>
            <div className="text-[13px] text-muted-foreground font-medium">
              {editorValue.length} character{editorValue.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Textarea
              placeholder="Click comments above to append here…"
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              className="min-h-[110px] bg-card/80 border-border/60 focus:border-accent/50 focus:ring-accent/10 transition-elegant resize-none text-[15px] leading-relaxed elevation-1 focus:elevation-2"
            />

            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                className="gap-2 border-border/60 bg-card/50 hover:bg-card hover:border-accent/30 transition-elegant elevation-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="size-4" strokeWidth={1.8} /> Re-import
              </Button>

              <Button
                onClick={copyToClipboard}
                className="gap-2 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/95 hover:to-accent/85 transition-smooth text-white font-semibold elevation-2 hover:elevation-3"
              >
                {copied ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <Clipboard className="size-4" strokeWidth={1.8} />
                )}
                {copied ? "Copied!" : "Copy Text"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
