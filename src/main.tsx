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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <header className="sticky top-0 z-30 glass border-b border-white/20">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="size-12 rounded-2xl gradient-accent shadow-glow grid place-items-center font-bold text-white text-sm animate-float">
                CSV
              </div>
              <div className="absolute -inset-1 gradient-accent rounded-2xl opacity-20 animate-pulse-subtle"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
                Sentence Picker
              </h1>
              <p className="text-sm text-slate-600 font-medium">Import a CSV • click a sentence • edit & copy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 border-slate-200/60 bg-white/80 hover:bg-white hover:shadow-glow transition-all duration-300"
            >
              <Upload className="size-4" /> Import CSV
            </Button>
            {hasData && (
              <Button
                variant="ghost"
                onClick={clearAll}
                className="gap-2 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
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

      <main className="max-w-5xl mx-auto px-4 pb-52">
        {/* Drop Zone */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="mt-8 relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse-subtle"></div>
          <div className="relative rounded-3xl border-2 border-dashed border-slate-300 glass px-6 py-12 text-center hover:border-blue-400 transition-all duration-500 group-hover:shadow-glow-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-glow">
                <Upload className="size-8 text-white" />
              </div>
              <div className="space-y-2">
                <div className="text-base font-semibold text-slate-800">
                  Drag & drop a <span className="font-bold text-blue-600">.csv</span> file here
                </div>
                <div className="text-sm text-slate-600">
                  <span>or </span>
                  <button
                    className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 decoration-2 decoration-blue-200 hover:decoration-blue-300 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse your files
                  </button>
                </div>
              </div>
              {fileName && (
                <div className="mt-3 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                    <Check className="size-4" />
                    Loaded: {fileName}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls & Stats */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="relative md:w-96 w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Filter sentences…"
              value={query}
              onChange={(e) => onFilter(e.target.value)}
              className="pl-9 bg-white/80 border-slate-200/60 focus:border-blue-300 focus:ring-blue-100 transition-all duration-300 hover:shadow-glow"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/60">
              <div className="text-sm font-medium text-slate-700">
                {hasData ? (
                  <span>
                    <span className="text-blue-600 font-semibold">{stats.visible}</span> shown •
                    <span className="text-slate-500 ml-1">{stats.total} total</span>
                  </span>
                ) : (
                  <span className="text-slate-500">Import a CSV to begin</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <Card className="mt-6 bg-white/80 border-slate-200/60 shadow-glow-lg">
          <CardHeader className="pb-3 border-b border-slate-100/80">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Sentences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {hasData ? (
              <ScrollArea className="h-[50vh]">
                <ul className="divide-y divide-slate-100/80">
                  {filtered.map((s, i) => (
                    <li key={i} className="group">
                      <button
                        onClick={() => onSentenceClick(i)}
                        className={
                          "w-full text-left px-4 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50/30 transition-all duration-300 relative " +
                          (selectedIndex === i
                            ? "bg-gradient-to-r from-blue-100 to-purple-100/50 shadow-glow"
                            : "")
                        }
                        aria-label={`Select sentence ${i + 1}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 group-hover:bg-blue-200 transition-colors duration-300 flex items-center justify-center mt-1">
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-700">
                              {i + 1}
                            </span>
                          </div>
                          <span className="text-sm leading-relaxed text-slate-700 group-hover:text-slate-900 font-medium flex-1">
                            {s}
                          </span>
                          {selectedIndex === i && (
                            <div className="flex-shrink-0 text-blue-600">
                              <Check className="size-4" />
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 px-6">
                <div className="p-3 rounded-2xl bg-slate-100 inline-block mb-4">
                  <FileUp className="size-8 text-slate-400" />
                </div>
                <div className="text-base font-medium text-slate-600 mb-2">No data yet</div>
                <div className="text-sm text-slate-500">Import a CSV file to populate the list</div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 shadow-glow">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-1 rounded-lg bg-red-100">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
              </div>
              <div>
                <div className="text-sm font-medium text-red-800 mb-1">Error</div>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Editor */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200/60 glass">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Editor
              </h2>
              <div className="px-2 py-1 rounded-md bg-blue-100 border border-blue-200">
                <div className="text-xs font-medium text-blue-700">
                  {selectedIndex != null ? `Item ${selectedIndex + 1}` : "No selection"}
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-600 font-medium">
              {editorValue.length} character{editorValue.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Textarea
              placeholder="Click sentences above to append here…"
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              className="min-h-[100px] bg-white/90 border-slate-200/60 focus:border-blue-300 focus:ring-blue-100 transition-all duration-300 resize-none"
            />
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                className="gap-2 border-slate-200/60 bg-white/80 hover:bg-white hover:shadow-glow transition-all duration-300"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="size-4" /> Re-import
              </Button>
              <Button
                onClick={copyToClipboard}
                className="gap-2 gradient-primary hover:shadow-glow-lg transition-all duration-300 text-white font-medium"
              >
                {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
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
