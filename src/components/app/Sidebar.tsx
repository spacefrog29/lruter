import { Icon } from "./Icon";

interface SidebarProps {
  onImportClick: () => void;
}

export function Sidebar({ onImportClick }: SidebarProps) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-surface flex-col py-8 px-6 pt-[6.5rem] z-40">
      {/* Mode indicator */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
          <Icon name="edit_note" className="!text-lg" />
        </div>
        <div>
          <div className="text-[1.0625rem] font-semibold text-primary leading-tight">
            Editorial
          </div>
          <div className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
            Curator Mode
          </div>
        </div>
      </div>

      {/* Navigation — only active items */}
      <nav className="flex flex-col gap-0.5">
        <span className="flex items-center gap-3 px-4 py-3 text-primary font-bold text-sm bg-surface-container-low border-r-2 border-primary rounded-md">
          <Icon name="book_5" className="!text-xl" />
          Workspace
        </span>
      </nav>

      {/* Import button at bottom */}
      <div className="mt-auto">
        <button
          onClick={onImportClick}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-lg bg-gradient-to-br from-primary-container to-primary text-white font-semibold text-sm shadow-[0_4px_16px_-2px_rgba(86,37,168,0.2)] hover:opacity-92 active:scale-[0.98] transition-all"
        >
          <Icon name="cloud_upload" className="!text-lg" />
          Import CSV
        </button>
      </div>
    </aside>
  );
}
