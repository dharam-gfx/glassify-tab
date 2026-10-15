import HydrationBuddy from './components/HydrationBuddy';
import IdleOverlay from './components/IdleOverlay';
import QuoteBar from './components/QuoteBar';
import TileEditorModal from './components/TileEditorModal';
import TopBar from './components/TopBar';
import Wallpaper from './components/Wallpaper';
import StudioDrawer from './drawer/StudioDrawer';
import { LAYOUTS } from './layouts';
import { useStore } from './state/store';

export default function App() {
  const { ready, settings } = useStore();
  if (!ready) return null;
  const Layout = LAYOUTS[settings.preset] ?? LAYOUTS.bento;

  return (
    <>
      <Wallpaper />
      <div className="app">
        <TopBar />
        <main className="dash">
          <Layout />
        </main>
      </div>
      <QuoteBar />
      <HydrationBuddy />
      <StudioDrawer />
      <TileEditorModal />
      <IdleOverlay />
    </>
  );
}
