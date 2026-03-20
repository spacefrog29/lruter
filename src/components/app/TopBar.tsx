import { Icon } from "./Icon";

interface TopBarProps {
  fileName: string | null;
}

export function TopBar({ fileName }: TopBarProps) {
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface flex items-center justify-between px-8 h-[72px]">
        {/* Left: brand */}
        <div className="flex items-center gap-10">
          <span className="text-xl font-extrabold tracking-tight text-on-surface">
            Sentence Picker
          </span>
          <nav className="hidden md:flex items-center gap-1">
            <span className="text-primary font-semibold text-sm px-3 py-1.5">Library</span>
          </nav>
        </div>

        {/* Right: search + actions */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant !text-[1.125rem]"
            />
            <input
              type="text"
              placeholder="Quick find..."
              className="bg-surface-container-highest border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow font-sans"
            />
          </div>

          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors">
            <Icon name="settings" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors">
            <Icon name="help" />
          </button>

          <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden ml-1">
            <div className="w-full h-full bg-gradient-to-br from-primary-fixed-dim to-primary-container rounded-full" />
          </div>
        </div>
      </header>

      <div className="bg-surface-container h-px w-full fixed top-[72px] z-50" />
    </>
  );
}
