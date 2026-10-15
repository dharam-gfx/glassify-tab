import { useEffect, useRef, useState } from 'react';
import { TILE_DRAG } from './Tile';
import { useStore } from '../state/store';
import { findOpenGridCell } from '../lib/gridPlacement';

export default function SnapGrid({ children, className = '' }) {
  const { setTileGridPosition, editMode } = useStore();
  const gridRef = useRef(null);
  const [dropActive, setDropActive] = useState(false);

  useEffect(() => {
    if (!editMode) setDropActive(false);
  }, [editMode]);
  const classes = ['bento-grid', 'snap-grid-surface', editMode && 'snap-grid-editing', dropActive && 'snap-grid-drop-active', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={gridRef}
      className={classes}
      onDragOverCapture={(event) => {
        if (!event.dataTransfer.types.includes(TILE_DRAG) || event.target.closest('.tile, .app-group')) return;
        event.preventDefault();
        event.stopPropagation();
        setDropActive(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDropActive(false);
      }}
      onDragEndCapture={() => setDropActive(false)}
      onDropCapture={(event) => {
        setDropActive(false);
        if (event.target.closest('.tile, .app-group')) return;
        const tileId = event.dataTransfer.getData(TILE_DRAG);
        if (!tileId) return;
        event.preventDefault();
        event.stopPropagation();
        setTileGridPosition(tileId, findOpenGridCell(gridRef.current, event, tileId));
      }}
    >
      {children}
    </div>
  );
}
