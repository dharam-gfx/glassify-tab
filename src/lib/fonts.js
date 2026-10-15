// Popular Google Fonts, self-hosted from public/fonts so they work offline and load before first paint.
export const FONTS = [
  { id: 'inter', name: 'Inter', family: 'Inter Variable', file: 'inter-latin.woff2', weight: '100 900', category: 'Sans' },
  { id: 'system', name: 'System', category: 'Sans' },
  { id: 'manrope', name: 'Manrope', family: 'Manrope Variable', weight: '200 800', category: 'Sans' },
  { id: 'plus-jakarta-sans', name: 'Plus Jakarta', family: 'Plus Jakarta Sans Variable', weight: '200 800', category: 'Sans' },
  { id: 'dm-sans', name: 'DM Sans', family: 'DM Sans Variable', weight: '100 1000', category: 'Sans' },
  { id: 'figtree', name: 'Figtree', family: 'Figtree Variable', weight: '300 900', category: 'Sans' },
  { id: 'outfit', name: 'Outfit', family: 'Outfit Variable', weight: '100 900', category: 'Sans' },
  { id: 'sora', name: 'Sora', family: 'Sora Variable', weight: '100 800', category: 'Sans' },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat Variable', weight: '100 900', category: 'Sans' },
  { id: 'nunito', name: 'Nunito', family: 'Nunito Variable', weight: '200 1000', category: 'Rounded' },
  { id: 'quicksand', name: 'Quicksand', family: 'Quicksand Variable', weight: '300 700', category: 'Rounded' },
  { id: 'space-grotesk', name: 'Space Grotesk', family: 'Space Grotesk Variable', weight: '300 700', category: 'Display' },
  { id: 'playfair-display', name: 'Playfair', family: 'Playfair Display Variable', weight: '400 900', category: 'Serif' },
  { id: 'lora', name: 'Lora', family: 'Lora Variable', weight: '400 700', category: 'Serif' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', family: 'JetBrains Mono Variable', weight: '100 800', category: 'Mono' },
];

const SYSTEM_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const FALLBACK = { Sans: 'system-ui, sans-serif', Rounded: 'system-ui, sans-serif', Display: 'system-ui, sans-serif', Serif: 'Georgia, serif', Mono: 'ui-monospace, Consolas, monospace' };

export function fontUrl(font) {
  return `/fonts/${font.file ?? `${font.id}.woff2`}`;
}

/** Everything needed to render a font: CSS stack, @font-face rule and the file to preload. */
export function fontAssets(id) {
  const font = FONTS.find((f) => f.id === id) ?? FONTS[0];
  if (!font.family) return { stack: SYSTEM_STACK, css: '', preload: null };
  return {
    stack: `"${font.family}", ${FALLBACK[font.category]}`,
    css: `@font-face{font-family:"${font.family}";font-style:normal;font-weight:${font.weight};font-display:block;src:url("${fontUrl(font)}") format("woff2-variations");}`,
    preload: fontUrl(font),
  };
}
