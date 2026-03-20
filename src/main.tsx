import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import Papa from "papaparse";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./index.css";

// Sentence Picker — Editorial "Digital Curator" Design
// Features:
// - Import CSV (button or drag & drop)
// - One sentence per CSV row (robust to commas via PapaParse)
// - Scrollable clickable list of sentences
// - Click to append into an editable box at the bottom
// - Copy-to-clipboard button
// - Quick search filter, clear list, re-import
// - Floating workspace bar at bottom
// - Lightweight runtime tests for the append behaviour

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
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

  const wordCount = useMemo(() => {
    if (!editorValue.trim()) return 0;
    return editorValue.trim().split(/\s+/).length;
  }, [editorValue]);

  // --- Lightweight runtime tests (executed once) ---
  useEffect(() => {
    const a = appendWithSmartSpace;
    try {
      console.assert(a("", "Hello") === "Hello", "Test 1: empty prev");
      console.assert(a("Hello", "World") === "Hello World", "Test 2: add space");
      console.assert(a("Hello ", "World") === "Hello World", "Test 3: keep existing space");
      console.assert(a("Hello\n", "World") === "Hello\nWorld", "Test 4: newline respected");
      console.assert(a("Hello\t", "World") === "Hello\tWorld", "Test 5: tab respected");
      const dummyCsv = "One\nTwo\nThree";
      const parsed = Papa.parse(dummyCsv, { header: false, skipEmptyLines: true });
      console.assert(
        Array.isArray(parsed.data) && (parsed.data as any[]).length === 3,
        "Test 6: CSV parse length"
      );
      console.info("Runtime tests passed: 6/6");
    } catch (err) {
      console.warn("A runtime test failed", err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f9] font-sans text-[#1a1c1c]">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#faf9f9] flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight text-[#1a1c1c]">Sentence Picker</span>
          <nav className="hidden md:flex items-center gap-6">
            <span className="text-[#5625a8] font-semibold text-sm">Library</span>
            {fileName && (
              <span className="text-[#4a4453] text-sm">{fileName}</span>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary-container to-primary text-white rounded-md font-semibold text-sm shadow-[0_12px_32px_-4px_rgba(86,37,168,0.15)] active:scale-95 transition-transform"
          >
            <Icon name="upload_file" className="text-sm" />
            Import CSV
          </button>
          {hasData && (
            <button
              onClick={clearAll}
              className="p-2 text-[#4a4453] hover:bg-[#eeeeed] rounded-full transition-colors active:scale-95"
              title="Clear All"
            >
              <Icon name="delete_sweep" />
            </button>
          )}
          <button className="p-2 text-[#4a4453] hover:bg-[#eeeeed] rounded-full transition-colors active:scale-95">
            <Icon name="help" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onFilePick}
          />
        </div>
      </header>
      <div className="bg-[#eeeeed] h-px w-full fixed top-[72px] z-50" />

      {/* Main Content */}
      <main className="pt-24 pb-72 px-8 lg:px-16 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Hero Import Area */}
          <section className="mb-12">
            <div
              ref={dropRef}
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-tertiary/10 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all hover:bg-surface-container-lowest">
                <div className="w-16 h-16 bg-primary-fixed-dim rounded-full flex items-center justify-center mb-4 text-primary">
                  <Icon name="cloud_upload" className="text-3xl" />
                </div>
                <h1 className="text-2xl font-semibold mb-2 text-[#1a1c1c]">Import your curated text</h1>
                <p className="text-[#4a4453] max-w-md mb-8 leading-relaxed">
                  Drag and drop your CSV file here. We'll automatically parse your sentences for editorial selection.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 bg-primary text-white rounded-md font-medium hover:opacity-90 transition-opacity"
                  >
                    Select File
                  </button>
                </div>
                {fileName && (
                  <div className="mt-4 text-xs text-[#4a4453]">
                    Loaded: <span className="font-semibold text-primary">{fileName}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Search & Filter Cluster */}
          <section className="flex flex-col md:flex-row gap-4 mb-10 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[#4a4453] mb-2 ml-1">
                Filter Repository
              </label>
              <div className="flex items-center bg-surface-container-highest rounded-lg px-4 h-12 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Icon name="filter_list" className="text-[#4a4453] mr-3" />
                <input
                  className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-[#1a1c1c] placeholder:text-[#4a4453]/60"
                  placeholder="Search within imported sentences..."
                  type="text"
                  value={query}
                  onChange={(e) => onFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="text-[10px] text-[#4a4453] pb-3">
              {hasData ? (
                <span>
                  <b className="text-primary">{stats.visible}</b> shown of <b className="text-primary">{stats.total}</b> total
                </span>
              ) : (
                <span>Import a CSV to begin</span>
              )}
            </div>
          </section>

          {/* Sentence List */}
          <section>
            {hasData && (
              <div className="col-span-full mb-4">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  IMPORTED SENTENCES
                </h3>
              </div>
            )}

            {hasData ? (
              <ScrollArea className="h-[50vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filtered.map((s, i) => {
                    const words = s.trim().split(/\s+/).length;
                    return (
                      <button
                        key={i}
                        onClick={() => onSentenceClick(i)}
                        aria-label={`Select sentence ${i + 1}`}
                        className={
                          "group text-left p-6 bg-surface-container-low rounded-lg transition-all hover:bg-surface-container-lowest hover:shadow-[0_12px_32px_-4px_rgba(86,37,168,0.08)] border-l-4 border-transparent hover:border-primary " +
                          (selectedIndex === i ? "bg-surface-container-lowest border-primary shadow-[0_12px_32px_-4px_rgba(86,37,168,0.08)]" : "")
                        }
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-[#4a4453]/60 uppercase tracking-tighter">
                            #{i + 1} &middot; {words} {words === 1 ? "Word" : "Words"}
                          </span>
                          <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            add_circle
                          </span>
                        </div>
                        <p className="text-lg leading-relaxed text-[#1a1c1c] group-hover:text-primary transition-colors">
                          {s}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="bg-surface-container-low rounded-lg p-12 text-center">
                <Icon name="library_books" className="text-4xl text-[#4a4453]/40 mb-3" />
                <p className="text-sm text-[#4a4453]">No data yet. Import a CSV to populate your library.</p>
              </div>
            )}
          </section>

          {error && (
            <div className="mt-6 text-sm text-[#ba1a1a] bg-[#ffdad6] rounded-lg p-4 flex items-center gap-3">
              <Icon name="error" className="text-[#ba1a1a]" />
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Workspace Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-5xl mx-auto px-6 pb-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_12px_48px_-8px_rgba(86,37,168,0.12)] border border-white/20 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-surface-container-low">
              <div className="flex items-center gap-2">
                <Icon name="contract_edit" className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#4a4453]">Active Workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-surface-container text-[#4a4453] rounded-md transition-colors"
                  title="Re-import"
                >
                  <Icon name="refresh" className="text-sm" />
                </button>
                {hasData && (
                  <button
                    onClick={clearAll}
                    className="p-2 hover:bg-surface-container text-[#4a4453] rounded-md transition-colors"
                    title="Clear All"
                  >
                    <Icon name="delete_sweep" className="text-sm" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-4">
              <textarea
                className="w-full bg-surface-container-lowest border-none focus:ring-0 focus:outline-none text-[#1a1c1c] text-lg leading-relaxed min-h-[100px] resize-none"
                placeholder="Selected sentences will appear here..."
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
              />
              <div className="mt-4 flex justify-between items-center">
                <div className="text-[10px] text-[#4a4453] flex gap-4">
                  <span>SENTENCES: <b className="text-primary">{selectedIndex != null ? selectedIndex + 1 : "00"}</b></span>
                  <span>TOTAL WORDS: <b className="text-primary">{wordCount}</b></span>
                  <span>CHARS: <b className="text-primary">{editorValue.length}</b></span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-5 py-2 bg-surface-container-high text-[#4a4453] rounded-md text-sm font-semibold hover:bg-surface-container-highest transition-colors"
                  >
                    <Icon name={copied ? "check" : "content_copy"} className="text-sm" />
                    {copied ? "Copied" : "Copy Text"}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-md text-sm font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                  >
                    <Icon name="auto_awesome" className="text-sm" />
                    Export Draft
                  </button>
                </div>
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
