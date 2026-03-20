import { Icon } from "./Icon";

interface FilterRowProps {
  query: string;
  onFilterText: (val: string) => void;
  selectedGroup: string;
  onFilterGroup: (val: string) => void;
  groups: string[];
  visibleCount: number;
  totalCount: number;
  hasData: boolean;
}

export function FilterRow({
  query,
  onFilterText,
  selectedGroup,
  onFilterGroup,
  groups,
  visibleCount,
  totalCount,
  hasData,
}: FilterRowProps) {
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
            onChange={(e) => onFilterText(e.target.value)}
          />
        </div>
      </div>

      {/* Group filter — only shown when there are multiple groups */}
      {hasData && groups.length > 1 && (
        <div className="w-full md:w-56">
          <label className="block text-[0.625rem] uppercase tracking-[0.1em] font-bold text-on-surface-variant mb-2 ml-1">
            Group
          </label>
          <div className="relative">
            <select
              value={selectedGroup}
              onChange={(e) => onFilterGroup(e.target.value)}
              className="w-full h-12 bg-surface-container-highest border-none rounded-lg px-4 appearance-none focus:shadow-[0_0_0_2px_rgba(86,37,168,0.15)] text-on-surface text-[0.9375rem] font-sans outline-none cursor-pointer"
            >
              <option value="ALL">All Groups</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <Icon
              name="expand_more"
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
            />
          </div>
        </div>
      )}

      {/* Stats indicator */}
      {hasData && (
        <div className="text-[0.625rem] font-bold uppercase tracking-wide text-on-surface-variant pb-3.5">
          <b className="text-primary">{visibleCount}</b> of <b className="text-primary">{totalCount}</b> shown
        </div>
      )}
    </section>
  );
}
