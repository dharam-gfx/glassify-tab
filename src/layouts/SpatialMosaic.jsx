import Tile from '../components/Tile';
import SnapGrid from '../components/SnapGrid';
import WidgetSlot, { useWidgetOrder } from '../components/WidgetSlot';
import { useStore } from '../state/store';
import AppGroupWidget from '../widgets/AppGroupWidget';
import { WIDGET_CATALOG } from '../widgets/catalog';

export default function SpatialMosaic() {
  const { tiles, settings, removeWidget } = useStore();
  const groups = new Map();
  const loose = [];
  for (const t of tiles) {
    if (t.group) groups.set(t.group, [...(groups.get(t.group) ?? []), t]);
    else loose.push(t);
  }

  const enabled = (settings.layoutWidgets.mosaic ?? []).filter((id) => WIDGET_CATALOG[id]);
  const groupIds = [...groups.keys()].map((name) => `group:${name}`);
  const order = useWidgetOrder('mosaic', [...enabled, ...groupIds]);

  return (
    <SnapGrid>
      {order.ids.map((id) => {
        if (id.startsWith('group:')) {
          const name = id.slice(6);
          return (
            <WidgetSlot key={id} id={id} layout="mosaic" defaultSize="2x1" fitRows label={name} onMove={order.move}>
              <AppGroupWidget title={name} tiles={groups.get(name)} />
            </WidgetSlot>
          );
        }
        const w = WIDGET_CATALOG[id];
        return (
          <WidgetSlot
            key={id}
            id={id}
            layout="mosaic"
            defaultSize={w.span.replace('span-', '')}
            onMove={order.move}
            onRemove={() => removeWidget('mosaic', id)}
            label={w.name}
          >
            <w.Component span="" />
          </WidgetSlot>
        );
      })}
      {loose.map((t) => (
        <Tile key={t.id} tile={t} groupAware gridPosition={t.gridPosition ?? t.mosaicPosition} />
      ))}
    </SnapGrid>
  );
}
