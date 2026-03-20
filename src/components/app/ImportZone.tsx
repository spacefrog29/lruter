import React from "react";
import { Icon } from "./Icon";

interface ImportZoneProps {
  dropRef: React.RefObject<HTMLDivElement>;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onSelectFile: () => void;
  fileName: string | null;
}

export function ImportZone({ dropRef, onDrop, onDragOver, onSelectFile, fileName }: ImportZoneProps) {
  return (
    <section className="mb-11">
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all hover:bg-surface-container-lowest"
      >
        {/* Upload icon circle */}
        <div className="w-16 h-16 bg-primary-fixed-dim rounded-full flex items-center justify-center mb-5">
          <Icon name="cloud_upload" className="!text-3xl text-primary" />
        </div>

        <h1 className="text-2xl font-semibold mb-2 text-on-surface tracking-tight">
          Import your curated text
        </h1>
        <p className="text-on-surface-variant max-w-md mb-8 leading-relaxed text-[0.9375rem]">
          Drag and drop your CSV or TXT file here. We'll automatically parse your sentences for editorial selection.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onSelectFile}
            className="px-6 py-2.5 rounded-md bg-gradient-to-br from-primary-container to-primary text-white font-medium text-[0.9375rem] hover:opacity-92 transition-opacity"
          >
            Select File
          </button>
          <button className="px-6 py-2.5 rounded-md bg-surface-container-high text-on-surface-variant font-medium text-[0.9375rem] hover:bg-surface-container-highest transition-colors">
            View Samples
          </button>
        </div>

        {fileName && (
          <div className="mt-5 text-xs text-on-surface-variant">
            Loaded: <span className="font-semibold text-primary">{fileName}</span>
          </div>
        )}
      </div>
    </section>
  );
}
