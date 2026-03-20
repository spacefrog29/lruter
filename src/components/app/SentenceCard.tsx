import { Icon } from "./Icon";
import type { CommentRow } from "./types";

interface SentenceCardProps {
  row: CommentRow;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export function SentenceCard({ row, index, isSelected, onClick }: SentenceCardProps) {
  const words = row.text.trim().split(/\s+/).length;

  return (
    <button
      onClick={onClick}
      aria-label={`Select sentence ${index + 1}`}
      className={`group text-left p-6 rounded-lg transition-all border-l-4
        ${isSelected
          ? "bg-surface-container-lowest border-primary shadow-[0_12px_32px_-4px_rgba(86,37,168,0.08)]"
          : "bg-surface-container-low border-transparent hover:bg-surface-container-lowest hover:shadow-[0_12px_32px_-4px_rgba(86,37,168,0.08)] hover:border-primary"
        }`}
    >
      {/* Tag row — shows the actual group from CSV data */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-[0.625rem] font-bold text-on-surface-variant/55 uppercase tracking-wider">
          {row.group} &middot; {words} {words === 1 ? "Word" : "Words"}
        </span>
        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          add_circle
        </span>
      </div>

      {/* Sentence text — the "hero" element per design spec */}
      <p className={`text-lg leading-relaxed transition-colors
        ${isSelected ? "text-primary" : "text-on-surface group-hover:text-primary"}`}>
        {row.text}
      </p>
    </button>
  );
}
