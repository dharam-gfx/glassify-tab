function parseTracks(value) {
  return value.split(' ').map(Number.parseFloat).filter(Number.isFinite);
}

function trackStart(index, sizes, gap, start, fallback) {
  let position = start;
  for (let current = 0; current < index - 1; current += 1) position += (sizes[current] ?? fallback) + gap;
  return position;
}

function nearestIndex(value, centers) {
  let bestIndex = 0;
  for (let index = 1; index < centers.length; index += 1) {
    if (Math.abs(centers[index] - value) < Math.abs(centers[bestIndex] - value)) bestIndex = index;
  }
  return bestIndex + 1;
}

export function findOpenGridCell(grid, event, tileId) {
  const bounds = grid.getBoundingClientRect();
  const style = getComputedStyle(grid);
  const columns = parseTracks(style.gridTemplateColumns);
  const rows = parseTracks(style.gridTemplateRows);
  const columnGap = Number.parseFloat(style.columnGap) || 0;
  const rowGap = Number.parseFloat(style.rowGap) || 0;
  const fallbackWidth = columns[0] || 120;
  const fallbackHeight = Number.parseFloat(style.getPropertyValue('--tile')) + 22 || 100;
  const columnsWidth = columns.reduce((sum, width) => sum + width, 0) + columnGap * Math.max(0, columns.length - 1);
  const rowsHeight = rows.reduce((sum, height) => sum + height, 0) + rowGap * Math.max(0, rows.length - 1);
  const startX = bounds.left + (style.justifyContent === 'center' ? Math.max(0, (bounds.width - columnsWidth) / 2) : 0);
  const startY = bounds.top + (style.alignContent === 'center' ? Math.max(0, (bounds.height - rowsHeight) / 2) : 0);
  const columnCenters = columns.map((width, index) => trackStart(index + 1, columns, columnGap, startX, fallbackWidth) + width / 2);
  const rowStarts = rows.map((_, index) => trackStart(index + 1, rows, rowGap, startY, fallbackHeight));
  const desiredColumn = nearestIndex(event.clientX, columnCenters);
  const desiredRow = nearestIndex(event.clientY, rows.map((height, index) => rowStarts[index] + height / 2));
  const items = [...grid.children]
    .filter((item) => item.dataset.tileId !== tileId)
    .map((item) => ({ item, rect: item.getBoundingClientRect() }));
  const tileCells = items
    .filter(({ item }) => item.dataset.tileId)
    .map(({ item, rect }) => ({
      column: item.style.gridColumn ? Number(item.style.gridColumn) : nearestIndex(rect.left + rect.width / 2, columnCenters),
      row: item.style.gridRow ? Number(item.style.gridRow) : nearestIndex(rect.top, rowStarts),
    }));
  const candidates = [];

  for (let row = 1; row <= Math.max(rows.length + 8, desiredRow + 3); row += 1) {
    const top = trackStart(row, rows, rowGap, startY, fallbackHeight);
    const centerY = top + (rows[row - 1] ?? fallbackHeight) / 2;
    for (let column = 1; column <= columns.length; column += 1) {
      const left = trackStart(column, columns, columnGap, startX, fallbackWidth);
      const centerX = left + (columns[column - 1] ?? fallbackWidth) / 2;
      const occupiedByTile = tileCells.some((cell) => cell.column === column && cell.row === row);
      const occupiedByWidget = items.some(({ item, rect }) =>
        !item.dataset.tileId && centerX >= rect.left && centerX < rect.right && centerY >= rect.top && centerY < rect.bottom
      );
      if (!occupiedByTile && !occupiedByWidget) {
        candidates.push({ column, row, distance: (centerX - event.clientX) ** 2 + (centerY - event.clientY) ** 2 });
      }
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0] ? { column: candidates[0].column, row: candidates[0].row } : { column: desiredColumn, row: desiredRow };
}
