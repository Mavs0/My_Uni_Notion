export function darkenHex(hex: string, amount: number): string {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(
    0,
    Math.min(255, Math.round(((n >> 16) & 255) * (1 - amount))),
  );
  const g = Math.max(
    0,
    Math.min(255, Math.round(((n >> 8) & 255) * (1 - amount))),
  );
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * (1 - amount))));
  return `#${[r, g, b]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function accentColorFromId(id: string): { from: string; to: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = id.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  const from = `hsl(${hue} 62% 46%)`;
  const to = `hsl(${(hue + 18) % 360} 55% 32%)`;
  return { from, to };
}
