import { Icon } from "./Icon";

interface FilterRowProps {
  query: string;
  onFilter: (val: string) => void;
  visibleCount: number;
  totalCount: number;
  hasData: boolean;
}

export function FilterRow({ query, onFilter, visibleCount, totalCount, hasData }: FilterRowProps) {
  return (
    <section className="flex flex-col md:flex-row gap-4 mb-11 items-end">
      {/* Search input */}
      <div className="flex-1 w-full">
        <label className="block text-[0.625rem] uppercase tracking-[0.1em] font-bold text-on-surface-variant mb-2 ml-1">
          Filter Sentences
        </label>
        <div className="flex items-center bg-surface-container-highest rounded-lg px-4 h-12 focus-within:shadow-[0_0_0_2px_rgba(86,37,168,0.15)] transition-shadow">
          <Icon name="filter_list" className="text-on-surface-variant mr-3 !text-xl" />
          <input
            className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-on-surface placeholder:text-on-surface-variant/60 text-[0.9375rem] font-sans"
            placeholder="Search within imported sentences..."
            type="text"
            value={query}
            onChange={(e) => onFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Stats indicator */}
      {hasData && (
        <div className="text-[0.625rem] font-bold uppercase tracking-wide text-on-surface-variant pb-3.5">
          <b className="text-primary">{visibleCount}</b> of <b className="text-primary">{totalCount}</b> shown
        </div>
      )}
    </section>
  );
}
