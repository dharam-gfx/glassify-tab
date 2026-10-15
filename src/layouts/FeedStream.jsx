import Tile from '../components/Tile';
import WidgetSlot, { useWidgetOrder } from '../components/WidgetSlot';
import { useStore } from '../state/store';
import { WIDGET_CATALOG } from '../widgets/catalog';

export default function FeedStream() {
    const { tiles, settings, removeWidget } = useStore();
    const enabled = settings.layoutWidgets.feed ?? [];
    const order = useWidgetOrder( 'feed', enabled );
    return (
        <div className="feed">
            <nav className="glass feed-rail" aria-label="Quick access">
                <div className="feed-rail-scroll">
                    {tiles.map( ( t ) => (
                        <Tile key={t.id} tile={t} />
                    ) )}
                </div>
            </nav>
            <div className="feed-main">
                {order.ids.map( ( id ) => {
                    const w = WIDGET_CATALOG[id];
                    return (
                        <WidgetSlot
                            key={id}
                            id={id}
                            layout="feed"
                            mode="feed"
                            defaultSize="2x2"
                            onMove={order.move}
                            onRemove={() => removeWidget( 'feed', id )}
                            label={w.name}
                        >
                            <w.Component span="" />
                        </WidgetSlot>
                    );
                } )}
            </div>
        </div>
    );
}
