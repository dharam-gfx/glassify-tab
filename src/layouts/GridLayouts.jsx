import Tile from '../components/Tile';
import SnapGrid from '../components/SnapGrid';
import WidgetSlot, { useWidgetOrder } from '../components/WidgetSlot';
import { useStore } from '../state/store';
import { WIDGET_CATALOG } from '../widgets/catalog';

function GridLayout({ layout }) {
  const { tiles, settings, removeWidget } = useStore();
  const enabled = settings.layoutWidgets[layout] ?? [];
  const order = useWidgetOrder(layout, enabled);
  const widgetSlots = order.ids.map((id) => {
    const w = WIDGET_CATALOG[id];
    return (
      <WidgetSlot
        key={id}
        id={id}
        layout={layout}
        defaultSize={w.span.replace('span-', '')}
        onMove={order.move}
        onRemove={() => removeWidget(layout, id)}
        label={w.name}
      >
        <w.Component span="" />
      </WidgetSlot>
    );
  });
  const appTiles = tiles.map((t) => (
    <Tile key={t.id} tile={t} gridPosition={t.gridPosition ?? t.mosaicPosition} />
  ));

  return (
    <SnapGrid>
      {layout === 'bento' || layout === 'fluid' ? <>{appTiles}{widgetSlots}</> : <>{widgetSlots}{appTiles}</>}
    </SnapGrid>
  );
}

export const OrderedBento = () => <GridLayout layout="bento" />;
export const FluidGrid = () => <GridLayout layout="fluid" />;
