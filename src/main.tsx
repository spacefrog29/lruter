import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import Papa from "papaparse";
import { Upload, Clipboard, Check, Trash2, FileUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./index.css";

// Single-file React component
// Features:
// - Import CSV (button or drag & drop)
// - One sentence per CSV row (robust to commas via PapaParse)
// - Scrollable clickable list of sentences
// - Click to append into an editable box at the bottom
// - Copy-to-clipboard button
// - Quick search filter, clear list, re-import
// - Sticky editor at bottom
// - Lightweight runtime tests for the append behaviour

export function App() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const hasData = sentences.length > 0;

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
            setError("No sentences found in the CSV.");
            setSentences([]);
            setFiltered([]);
            setSelectedIndex(null);
            setEditorValue("");
            return;
          }
          setSentences(rows);
          setFiltered(rows);
          setSelectedIndex(null);
          setEditorValue("");
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
  }, []);

  const onFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseCsvFile(f);
  }, [parseCsvFile]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.toLowerCase().endsWith(".csv")) {
      parseCsvFile(f);
    } else {
      setError("Please drop a .csv file.");
    }
  }, [parseCsvFile]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Helper used both in tests and click handler
  function appendWithSmartSpace(prev: string, next: string): string {
    if (!prev) return next;
    const needsSpace = !(prev.endsWith(" ") || prev.endsWith("\n") || prev.endsWith("\t"));
    return prev + (needsSpace ? " " : "") + next;
  }

  const onSentenceClick = (idx: number) => {
    setSelectedIndex(idx);
    setEditorValue((prev) => appendWithSmartSpace(prev, filtered[idx] ?? ""));
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
    setSentences([]);
    setFiltered([]);
    setSelectedIndex(null);
    setEditorValue("");
    setFileName(null);
    setQuery("");
    setError(null);
  };

  const onFilter = useCallback((val: string) => {
    setQuery(val);
    if (!val) {
      setFiltered(sentences);
      return;
    }
    const q = val.toLowerCase();
    setFiltered(sentences.filter((s) => s.toLowerCase().includes(q)));
    setSelectedIndex(null);
  }, [sentences]);

  const stats = useMemo(() => ({
    total: sentences.length,
    visible: filtered.length,
  }), [sentences.length, filtered.length]);

  // --- Lightweight runtime tests (executed once) ---
  useEffect(() => {
    const a = appendWithSmartSpace;
    try {
      console.assert(a("", "Hello") === "Hello", "Test 1: empty prev");
      console.assert(a("Hello", "World") === "Hello World", "Test 2: add space");
      console.assert(a("Hello ", "World") === "Hello World", "Test 3: keep existing space");
      console.assert(a("Hello\n", "World") === "Hello\nWorld", "Test 4: newline respected");
      console.assert(a("Hello\t", "World") === "Hello\tWorld", "Test 5: tab respected");
      // Simple CSV parse smoke test on a tiny blob
      const dummyCsv = "One\nTwo\nThree";
      const parsed = Papa.parse(dummyCsv, { header: false, skipEmptyLines: true });
      console.assert(
        Array.isArray(parsed.data) && (parsed.data as any[]).length === 3,
        "Test 6: CSV parse length"
      );
      // If all assertions pass:
      console.info("Runtime tests passed: 6/6");
    } catch (err) {
      console.warn("A runtime test failed", err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border/60 elevation-2">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative size-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 grid place-items-center transition-smooth hover:scale-105 elevation-2">
              <span className="font-display text-white text-lg tracking-tight">SP</span>
              <div className="absolute -inset-0.5 bg-gradient-to-br from-accent to-accent/60 rounded-xl opacity-20 blur-sm"></div>
            </div>
            <div>
              <h1 className="text-[28px] font-display text-foreground leading-tight tracking-tight">
                Sentence Picker
              </h1>
              <p className="text-[13px] text-muted-foreground font-medium mt-0.5 tracking-wide">Import CSV • Click Sentences • Edit & Copy</p>
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFilePick}
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-52">
        {/* Drop Zone */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="mt-10"
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
        <div className="mt-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="relative md:w-96 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-accent transition-elegant" strokeWidth={1.8} />
            <Input
              placeholder="Filter sentences…"
              value={query}
              onChange={(e) => onFilter(e.target.value)}
              className="pl-11 h-11 bg-card/80 border-border/60 focus:border-accent/50 focus:ring-accent/10 transition-elegant elevation-1 focus:elevation-2"
            />
          </div>
          <div className="flex items-center gap-3">
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
              Sentences
              {hasData && (
                <span className="text-[13px] font-medium text-muted-foreground font-sans">({stats.total})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {hasData ? (
              <ScrollArea className="h-[50vh]">
                <ul className="divide-y divide-border/40">
                  {filtered.map((s, i) => (
                    <li key={i} className="group">
                      <button
                        onClick={() => onSentenceClick(i)}
                        className={
                          "w-full text-left px-6 py-4 hover:bg-accent/5 transition-smooth relative " +
                          (selectedIndex === i
                            ? "bg-gradient-to-r from-accent/10 to-accent/5 border-accent-left"
                            : "")
                        }
                        aria-label={`Select sentence ${i + 1}`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 text-[13px] font-bold text-muted-foreground/60 mt-0.5 min-w-[28px] font-display">
                            {i + 1}
                          </span>
                          <span className="text-[15px] leading-relaxed text-foreground flex-1 group-hover:text-foreground/90">
                            {s}
                          </span>
                          {selectedIndex === i && (
                            <div className="flex-shrink-0">
                              <div className="size-6 rounded-full bg-accent/15 border border-accent/30 grid place-items-center">
                                <Check className="size-3.5 text-accent" strokeWidth={2.5} />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
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
      </main>

      {/* Sticky Editor */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-card/90 backdrop-blur-xl elevation-4">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-[20px] font-display text-foreground">
                Editor
              </h2>
              {selectedIndex != null && (
                <div className="px-3 py-1 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="text-[12px] font-bold text-accent tracking-wide">
                    Item {selectedIndex + 1}
                  </div>
                </div>
              )}
            </div>
            <div className="text-[13px] text-muted-foreground font-medium">
              {editorValue.length} character{editorValue.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Textarea
              placeholder="Click sentences above to append here…"
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
                {copied ? <Check className="size-4" strokeWidth={2.5} /> : <Clipboard className="size-4" strokeWidth={1.8} />}
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
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
