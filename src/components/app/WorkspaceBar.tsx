import { Icon } from "./Icon";

interface WorkspaceBarProps {
  editorValue: string;
  onEditorChange: (val: string) => void;
  wordCount: number;
  sentenceCount: number;
  onCopy: () => void;
  onExport: () => void;
  onReimport: () => void;
  onClearAll: () => void;
  copied: boolean;
  hasData: boolean;
}

export function WorkspaceBar({
  editorValue,
  onEditorChange,
  wordCount,
  sentenceCount,
  onCopy,
  onExport,
  onReimport,
  onClearAll,
  copied,
  hasData,
}: WorkspaceBarProps) {
  return (
    <div className="mt-10">
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_12px_48px_-8px_rgba(86,37,168,0.08)] overflow-hidden">
        {/* Header — tonal shift background instead of border per design spec */}
        <div className="flex items-center justify-between px-6 py-3 bg-surface-container-low/60">
          <div className="flex items-center gap-2">
            <Icon name="contract_edit" className="text-primary !text-xl" />
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              Active Workspace
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onReimport}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-container text-on-surface-variant rounded-md transition-colors"
              title="Re-import Session"
            >
              <Icon name="refresh" className="!text-lg" />
            </button>
            {hasData && (
              <button
                onClick={onClearAll}
                className="w-8 h-8 flex items-center justify-center hover:bg-surface-container text-on-surface-variant rounded-md transition-colors"
                title="Clear All"
              >
                <Icon name="delete_sweep" className="!text-lg" />
              </button>
            )}
          </div>
        </div>

        {/* Editor body */}
        <div className="p-4 px-6">
          <textarea
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-on-surface text-lg leading-relaxed min-h-[120px] resize-none font-sans"
            placeholder="Selected sentences will appear here..."
            value={editorValue}
            onChange={(e) => onEditorChange(e.target.value)}
          />

          {/* Footer stats + actions */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-[0.625rem] text-on-surface-variant flex gap-5 font-bold uppercase tracking-wide">
              <span>
                Sentences: <b className="text-primary">{String(sentenceCount).padStart(2, "0")}</b>
              </span>
              <span>
                Total Words: <b className="text-primary">{String(wordCount).padStart(2, "0")}</b>
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCopy}
                className="flex items-center gap-2 px-5 py-2 bg-surface-container-high text-on-surface-variant rounded-md text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                <Icon name={copied ? "check" : "content_copy"} className="!text-base" />
                {copied ? "Copied!" : "Copy Text"}
              </button>
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-primary-container to-primary text-white rounded-md text-sm font-semibold shadow-[0_4px_12px_-2px_rgba(86,37,168,0.2)] active:scale-[0.97] transition-all"
              >
                <Icon name="auto_awesome" className="!text-base" />
                Export Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
