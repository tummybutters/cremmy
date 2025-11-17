export const nowIso = () => new Date().toISOString();
export const daysBetween = (a: string, b: string) =>
  Math.abs(Date.parse(a) - Date.parse(b)) / (1000 * 60 * 60 * 24);
export const generateTimestamp = () => nowIso();
