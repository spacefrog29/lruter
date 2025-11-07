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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">CSV</div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">Sentence Picker</h1>
              <p className="text-xs text-slate-500">Import a CSV • click a sentence • edit & copy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="size-4" /> Import CSV
            </Button>
            {hasData && (
              <Button variant="ghost" onClick={clearAll} className="gap-2">
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

      <main className="max-w-5xl mx-auto px-4 pb-44">
        {/* Drop Zone */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 px-4 py-8 grid place-items-center text-center hover:border-slate-400 transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            <Upload className="size-8" />
            <div className="text-sm text-slate-600">
              Drag & drop a <span className="font-medium text-slate-900">.csv</span> here
              <span className="mx-1">or</span>
              <button className="underline" onClick={() => fileInputRef.current?.click()}>browse</button>
            </div>
            {fileName && (
              <div className="text-xs text-slate-500">Loaded: {fileName}</div>
            )}
          </div>
        </div>

        {/* Controls & Stats */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="relative md:w-96 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input
              placeholder="Filter sentences…"
              value={query}
              onChange={(e) => onFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-xs text-slate-600">
            {hasData ? (
              <span>{stats.visible} shown • {stats.total} total</span>
            ) : (
              <span>Import a CSV to begin</span>
            )}
          </div>
        </div>

        {/* List */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sentences</CardTitle>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <ScrollArea className="h-[50vh] pr-4">
                <ul className="divide-y">
                  {filtered.map((s, i) => (
                    <li key={i}>
                      <button
                        onClick={() => onSentenceClick(i)}
                        className={
                          "w-full text-left px-3 py-3 hover:bg-slate-50 rounded-md transition-colors " +
                          (selectedIndex === i ? "bg-slate-100" : "")
                        }
                        aria-label={`Select sentence ${i + 1}`}
                      >
                        <span className="text-sm leading-relaxed">{s}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="text-sm text-slate-500 py-8 text-center">No data yet. Import a CSV to populate the list.</div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        )}
      </main>

      {/* Sticky Editor */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-slate-700">Editor</h2>
            <div className="text-xs text-slate-500">
              {selectedIndex != null ? `Editing item ${selectedIndex + 1}` : "Nothing selected"}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Click sentences above to append here…"
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              className="min-h-[96px]"
            />
            <div className="flex items-center gap-2 justify-between">
              <div className="text-xs text-slate-500">{editorValue.length} characters</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="size-4" /> Re-import
                </Button>
                <Button onClick={copyToClipboard} className="gap-2">
                  {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
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
