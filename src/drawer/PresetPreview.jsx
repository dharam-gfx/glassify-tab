// Mini wireframes of each layout: [x, y, w, h, kind] in percent; kind: t = tile, w = widget, g = group, r = rail.
const SHAPES = {
  bento: [
    ...[0, 1, 2, 3, 4, 5].map((i) => [6 + i * 15, 10, 11, 18, 't']),
    ...[0, 1, 2, 3, 4, 5].map((i) => [6 + i * 15, 34, 11, 18, 't']),
    [6, 58, 26, 34, 'w'],
    [36, 58, 26, 34, 'w'],
    [66, 58, 28, 34, 'w'],
  ],
  fluid: [
    ...Array.from({ length: 24 }, (_, i) => [5 + (i % 8) * 11.5, 10 + Math.floor(i / 8) * 20, 8.5, 14, 't']),
    [5, 72, 31, 20, 'w'],
    ...[0, 1, 2, 3, 4].map((i) => [39.5 + i * 11.5, 72, 8.5, 14, 't']),
  ],
  feed: [
    [5, 8, 12, 84, 'r'],
    [22, 8, 44, 38, 'w'],
    [70, 8, 25, 38, 'w'],
    [22, 52, 44, 40, 'w'],
    [70, 52, 25, 40, 'w'],
  ],
  mosaic: [
    [5, 8, 58, 40, 'w'],
    [67, 8, 28, 40, 'w'],
    [5, 54, 28, 18, 'g'],
    [37, 54, 28, 18, 'g'],
    [69, 54, 26, 38, 'w'],
    ...[0, 1, 2, 3].map((i) => [5 + i * 15.5, 77, 11, 15, 't']),
  ],
};

export default function PresetPreview({ preset }) {
  return (
    <span className="preset-preview" aria-hidden="true">
      {(SHAPES[preset] ?? []).map(([x, y, w, h, kind], i) => (
        <span key={i} className={`pp-${kind}`} style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }} />
      ))}
    </span>
  );
}
