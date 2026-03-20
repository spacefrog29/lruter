/** Represents a single row from an imported CSV. */
export type CommentRow = {
  id: string;
  group: string;
  text: string;
  order: number;
};

export const DEFAULT_GROUP = "Ungrouped";

export function safeStr(v: unknown): string {
  return v == null ? "" : String(v);
}

/** Normalise group names — collapse whitespace, default empty to "Ungrouped". */
export function normaliseGroup(g: string): string {
  const s = g.replace(/\s+/g, " ").trim();
  return s.length ? s : DEFAULT_GROUP;
}

/** Append text with smart spacing (no double spaces, respects newlines/tabs). */
export function appendWithSmartSpace(prev: string, next: string): string {
  if (!prev) return next;
  const needsSpace = !(prev.endsWith(" ") || prev.endsWith("\n") || prev.endsWith("\t"));
  return prev + (needsSpace ? " " : "") + next;
}
