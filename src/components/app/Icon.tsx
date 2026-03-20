/**
 * Material Symbols icon wrapper.
 * Uses the "Outlined" variant loaded via Google Fonts in index.html.
 */
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}
