import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import HydrationBuddy from './components/HydrationBuddy';
import IdleOverlay from './components/IdleOverlay';
import QuoteBar from './components/QuoteBar';
import BackToTop from './components/BackToTop';
import SpaceBar from './components/SpaceBar';
import TopBar from './components/TopBar';
import Wallpaper from './components/Wallpaper';
import { LAYOUTS } from './layouts';
import { useStore } from './state/store';
import { storage } from './state/storage';

const TOUR_EVENT = 'glassify:tour';
const TOUR_DONE_KEY = 'tourDone';

const TileEditorModal = lazy(() => import('./components/TileEditorModal'));
const StudioDrawer = lazy(() => import('./drawer/StudioDrawer'));
const WelcomeTour = lazy(() => import('./components/WelcomeTour'));

export default function App() {
  const { ready, settings, drawerOpen, editor, setDrawerOpen } = useStore();
  const [studioRequested, setStudioRequested] = useState(false);
  const [tourRun, setTourRun] = useState(0);
  const [tourInStudio, setTourInStudio] = useState(false);

  // Track if studio was opened by tour
  const tourOpenedStudio = useRef(false);

  const closeTour = () => {
    if (tourOpenedStudio.current) {
      setDrawerOpen(false);
      setStudioRequested(false);
      tourOpenedStudio.current = false;
    }
    setTourInStudio(false);
    setTourRun(0);
  };

  useEffect(() => {
    if (tourRun > 0 && tourInStudio) {
      if (!tourOpenedStudio.current) {
        tourOpenedStudio.current = true;
        setStudioRequested(true);
        setDrawerOpen(true);
      }
    } else if (tourRun > 0 && tourOpenedStudio.current && !tourInStudio) {
      // Tour exited studio section, close it
      setDrawerOpen(false);
      tourOpenedStudio.current = false;
      setStudioRequested(false);
    } else if (tourRun === 0) {
      // Tour ended, reset state
      tourOpenedStudio.current = false;
    }

    // Update studio requested for manual opens
    if (tourRun === 0 && drawerOpen && !studioRequested) {
      setStudioRequested(true);
    }
  }, [tourInStudio, tourRun, drawerOpen, studioRequested, setDrawerOpen]);

  // The tour chunk is only fetched for first-time users or when replayed from Studio.
  useEffect(() => {
    if (!ready) return;
    const start = () => setTourRun((n) => n + 1);
    const timer = setTimeout(() => {
      storage.get('local', [TOUR_DONE_KEY]).then((r) => !r[TOUR_DONE_KEY] && start());
    }, 800);
    window.addEventListener(TOUR_EVENT, start);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(TOUR_EVENT, start);
    };
  }, [ready]);

  if (!ready) return null;
  const Layout = LAYOUTS[settings.preset] ?? LAYOUTS.bento;

  return (
    <>
      <Wallpaper />
      <div className="app">
        <TopBar />
        <SpaceBar />
        <main className="dash">
          <Layout />
        </main>
      </div>
      <QuoteBar />
      <BackToTop />
      <HydrationBuddy />
      <Suspense fallback={null}>
        {studioRequested && <StudioDrawer />}
        {editor && <TileEditorModal />}
        {tourRun > 0 && <WelcomeTour key={tourRun} onClose={closeTour} onStudioChange={setTourInStudio} />}
      </Suspense>
      {tourRun === 0 && <IdleOverlay />}
    </>
  );
}
