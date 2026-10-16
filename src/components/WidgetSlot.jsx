import { Grip, Minus, Move } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';

export const WIDGET_DRAG = 'application/x-glassify-widget';

// Width x height in grid cells. Feed layout only uses width (half or full row).
export const WIDGET_SIZES = ['2x1', '2x2', '3x2', '4x2', '2x3', '4x3', '6x2'];

export function useWidgetOrder(layout, defaultIds) {
  const { settings, moveWidget } = useStore();
  const saved = settings.layoutOrder?.[layout];
  const known = Array.isArray(saved) ? saved.filter((id) => defaultIds.includes(id)) : [];
  const ids = [...known, ...defaultIds.filter((id) => !known.includes(id))];
  return { ids, move: (fromId, toId) => moveWidget(layout, ids, fromId, toId) };
}

function slotStyle(size, mode, cols, contentRows) {
  const [w, h] = size.split('x').map(Number);
  if (mode === 'feed') return { gridColumn: w >= 3 ? '1 / -1' : 'span 1' };
  return { gridColumn: `span ${Math.min(w, cols)}`, gridRow: `span ${Math.max(h, contentRows)}` };
}

function sizesFor(layout, mode, cols) {
  if (mode !== 'grid') return WIDGET_SIZES;
  return Array.from({ length: Math.max(0, cols - 1) }, (_, index) => index + 2)
    .flatMap((width) => [1, 2, 3].map((height) => `${width}x${height}`));
}

function nearestWidgetSize(width, height, sizes) {
  return sizes.slice().sort((a, b) => {
    const [aw, ah] = a.split('x').map(Number);
    const [bw, bh] = b.split('x').map(Number);
    return Math.abs(aw - width) + Math.abs(ah - height) - (Math.abs(bw - width) + Math.abs(bh - height));
  })[0];
}

function feedSizeForKey(key, size) {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null;
  const isFullWidth = Number(size.split('x')[0]) >= 3;
  if (isFullWidth === (key === 'ArrowRight')) return null;
  return key === 'ArrowRight' ? '4x2' : '2x2';
}

function gridSizeForKey(key, size, availableSizes) {
  const [width, height] = size.split('x').map(Number);
  let nextWidth = width;
  let nextHeight = height;
  if (key === 'ArrowRight') nextWidth += 1;
  if (key === 'ArrowLeft') nextWidth -= 1;
  if (key === 'ArrowDown') nextHeight += 1;
  if (key === 'ArrowUp') nextHeight -= 1;
  if (nextWidth === width && nextHeight === height) return null;
  return nearestWidgetSize(Math.max(2, nextWidth), Math.max(1, nextHeight), availableSizes);
}

/** Grid cell that holds one widget; in edit mode it can be dragged, resized and removed. */
export default function WidgetSlot({ id, layout, defaultSize = '2x2', mode = 'grid', fitRows = false, onMove, onRemove, label, children }) {
  const { editMode, settings, setWidgetSize, gridCols } = useStore();
  const [over, setOver] = useState(false);
  const [previewSize, setPreviewSize] = useState(null);
  const [contentRows, setContentRows] = useState(1);
  const resizeRef = useRef(null);
  const slotRef = useRef(null);
  const saved = settings.widgetSizes?.[layout]?.[id];
  const availableSizes = sizesFor(layout, mode, gridCols);
  const size = availableSizes.includes(saved) ? saved : defaultSize;
  const displaySize = previewSize ?? size;
  const responsiveRss = id === 'rss' && gridCols <= 2;
  const effectiveContentRows = fitRows ? contentRows : 1;
  const placementStyle = responsiveRss
    ? { gridColumn: '1 / span 2', gridRow: 'auto' }
    : slotStyle(displaySize, mode, gridCols, effectiveContentRows);

  useLayoutEffect(() => {
    if (!fitRows) return;
    const tileList = slotRef.current?.querySelector('.app-group-tiles');
    if (!tileList) return;
    const updateRows = () => {
      const rows = new Set([...tileList.children].map((tile) => Math.round(tile.getBoundingClientRect().top)));
      const nextRows = Math.max(1, rows.size);
      setContentRows((current) => (current === nextRows ? current : nextRows));
    };
    updateRows();
    const resizeObserver = new ResizeObserver(updateRows);
    const mutationObserver = new MutationObserver(updateRows);
    resizeObserver.observe(tileList);
    mutationObserver.observe(tileList, { childList: true });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [fitRows, children, settings.groupGap, settings.groupIconSize, settings.groupLabels, settings.labels]);

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const slot = event.currentTarget.closest('.widget-slot');
    const rect = slot.getBoundingClientRect();
    const gap = Number.parseFloat(getComputedStyle(slot).getPropertyValue('--gap')) || 0;
    const [width, height] = size.split('x').map(Number);
    const feed = slot.closest('.feed-main');
    const visibleWidth = Math.min(width, gridCols);
    resizeRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: visibleWidth,
      height,
      feedFullWidth: mode === 'feed' && width >= 3,
      stepX: mode === 'feed' && feed ? (feed.getBoundingClientRect().width + gap) / 2 : (rect.width + gap) / visibleWidth,
      stepY: (rect.height + gap) / height,
      preview: size,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveResize = (event) => {
    const session = resizeRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    if (mode === 'feed') {
      const delta = event.clientX - session.x;
      const resizeThreshold = session.stepX * 0.35;
      if (session.feedFullWidth && delta < -resizeThreshold) session.preview = '2x2';
      else if (!session.feedFullWidth && delta > resizeThreshold) session.preview = '4x2';
      else session.preview = size;
      setPreviewSize(session.preview);
      return;
    }
    const width = Math.max(2, session.width + Math.round((event.clientX - session.x) / session.stepX));
    const height = Math.max(1, session.height + Math.round((event.clientY - session.y) / session.stepY));
    session.preview = nearestWidgetSize(width, height, availableSizes);
    setPreviewSize(session.preview);
  };

  const finishResize = (event, commit) => {
    const session = resizeRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    resizeRef.current = null;
    setPreviewSize(null);
    if (commit && session.preview) {
      setWidgetSize(layout, id, session.preview === defaultSize ? null : session.preview);
    }
  };

  const resizeByKey = (event) => {
    const next = mode === 'feed'
      ? feedSizeForKey(event.key, size)
      : gridSizeForKey(event.key, size, availableSizes);
    if (!next) return;
    event.preventDefault();
    setWidgetSize(layout, id, next === defaultSize ? null : next);
  };

  return (
    <div
      ref={slotRef}
      className={`widget-slot${over ? ' drop-target' : ''}`}
      style={placementStyle}
      draggable={editMode}
      onDragStart={(e) => {
        if (e.target.closest('.widget-resize-handle')) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData(WIDGET_DRAG, id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(WIDGET_DRAG)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(false)}
      onDrop={(e) => {
        const from = e.dataTransfer.getData(WIDGET_DRAG);
        setOver(false);
        if (!from) return;
        e.preventDefault();
        if (from !== id) onMove(from, id);
      }}
    >
      {editMode && onRemove && (
        <button
          className="tile-remove widget-remove"
          aria-label={`Remove ${label ?? 'widget'}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
        >
          <Minus size={12} strokeWidth={3} />
        </button>
      )}
      {children}
      {editMode && (
        <>
          <button
            type="button"
            className="widget-drag-handle"
            draggable
            aria-label={`Move ${label ?? 'widget'}`}
            title={`Drag ${label ?? 'widget'} to reorder`}
            onDragStart={(event) => {
              event.stopPropagation();
              event.dataTransfer.setData(WIDGET_DRAG, id);
              event.dataTransfer.effectAllowed = 'move';
            }}
          >
            <Move size={14} />
          </button>
          {(mode === 'grid' || mode === 'feed') && (
            <button
              type="button"
              className={`widget-resize-handle${mode === 'feed' ? ' feed-resize-handle' : ''}`}
              aria-label={`Resize ${label ?? 'widget'}`}
              title={mode === 'feed' ? 'Drag horizontally to resize; use left/right arrows' : 'Drag to resize; use arrow keys for grid steps'}
              onPointerDown={startResize}
              onPointerMove={moveResize}
              onPointerUp={(event) => finishResize(event, true)}
              onPointerCancel={(event) => finishResize(event, false)}
              onKeyDown={resizeByKey}
              onClick={(event) => event.stopPropagation()}
            >
              <Grip size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
