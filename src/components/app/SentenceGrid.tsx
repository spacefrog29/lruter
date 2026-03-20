import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "./Icon";
import { SentenceCard } from "./SentenceCard";
import type { CommentRow } from "./types";

interface SentenceGridProps {
  rows: CommentRow[];
  selectedId: string | null;
  onRowClick: (row: CommentRow) => void;
  hasData: boolean;
  fileName: string | null;
}

export function SentenceGrid({ rows, selectedId, onRowClick, hasData, fileName }: SentenceGridProps) {
  if (!hasData) {
    return (
      <section>
        <div className="bg-surface-container-low rounded-lg p-12 text-center">
          <Icon name="library_books" className="!text-4xl text-on-surface-variant/40 mb-3" />
          <p className="text-sm text-on-surface-variant">
            No data yet. Import a CSV to populate your library.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Session header */}
      <div className="mb-5">
        <h3 className="text-sm font-bold text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {fileName ? `IMPORTED FROM ${fileName.toUpperCase()}` : "RECENTLY IMPORTED"}
        </h3>
      </div>

      {/* Scrollable card grid */}
      <ScrollArea className="h-[50vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-2">
          {rows.map((row, i) => (
            <SentenceCard
              key={row.id}
              row={row}
              index={i}
              isSelected={selectedId === row.id}
              onClick={() => onRowClick(row)}
            />
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
