import { lazy, Suspense, useEffect, useState } from 'react';
import HydrationBuddy from './components/HydrationBuddy';
import IdleOverlay from './components/IdleOverlay';
import QuoteBar from './components/QuoteBar';
import TopBar from './components/TopBar';
import Wallpaper from './components/Wallpaper';
import { LAYOUTS } from './layouts';
import { useStore } from './state/store';

const TileEditorModal = lazy(() => import('./components/TileEditorModal'));
const StudioDrawer = lazy(() => import('./drawer/StudioDrawer'));

export default function App() {
  const { ready, settings, drawerOpen, editor } = useStore();
  const [studioRequested, setStudioRequested] = useState(false);

  useEffect(() => {
    if (drawerOpen) setStudioRequested(true);
  }, [drawerOpen]);

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
      <Suspense fallback={null}>
        {studioRequested && <StudioDrawer />}
        {editor && <TileEditorModal />}
      </Suspense>
      <IdleOverlay />
    </>
  );
}
