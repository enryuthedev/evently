/**
 * Lightweight unique-id generator. Runtime-only (Date.now + Math.random),
 * good enough for client-side entity ids in Evently. See CONTRACT.md §10.
 */
export function genId(prefix: string = 'id'): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${time}${rand}`;
}
