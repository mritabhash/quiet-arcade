import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { ArcadeCat } from "./components/ArcadeCat";
import { GlowWorms } from "./components/GlowWorms";
import { AmbientRain } from "./components/AmbientRain";
import { PageAurora } from "./components/PageAurora";
import { AmbientVideo } from "./components/AmbientVideo";
import { ScrollWizard } from "./components/ScrollWizard";
import { GamesDragon, StatsPrincess } from "./components/PageCharacters";
import { EASE, ScrollProgress } from "./components/motion";
import { SigilDial } from "./components/SigilDial";
import { useSettings } from "./context/SettingsContext";
import { HomePage } from "./pages/Home";
import { GamesPage } from "./pages/Games";
import { StatsPage } from "./pages/Stats";
import { SettingsPage } from "./pages/Settings";
import { LorePage } from "./pages/Lore";
import { NotFoundPage } from "./pages/NotFound";
import { GamePage } from "./pages/GamePage";
import { AccountPage } from "./pages/Account";
import { LeaderboardPage } from "./pages/Leaderboard";
import { CastPage } from "./pages/Cast";
import { VersusPage } from "./pages/VersusPage";
import { VersusRoomPage } from "./pages/VersusRoomPage";

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: EASE }}
      className="min-h-[70vh]"
    >
      {children}
    </motion.main>
  );
}

/** Inertial scrolling for the whole app; anchors ride along, reduced motion opts out. */
function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ duration: 1.1, anchors: true });
    let rafId = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [enabled]);
}

export default function App() {
  const location = useLocation();
  const { motionOK } = useSettings();
  useSmoothScroll(motionOK);

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sand-50"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <AmbientVideo />
      <PageAurora pathname={location.pathname} />
      <AmbientRain />
      <GlowWorms />
      <SigilDial />
      <ArcadeCat />
      {/* page residents live here, outside the animated main, so
          position:fixed truly pins them to the viewport */}
      {location.pathname === "/" && <ScrollWizard />}
      {location.pathname === "/games" && <GamesDragon />}
      {location.pathname === "/stats" && <StatsPrincess />}
      <Nav />
      <div id="main-content" className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Page><HomePage /></Page>} />
            <Route path="/games" element={<Page><GamesPage /></Page>} />
            <Route path="/games/:gameId" element={<Page><GamePage /></Page>} />
            <Route path="/stats" element={<Page><StatsPage /></Page>} />
            <Route path="/leaderboards" element={<Page><LeaderboardPage /></Page>} />
            <Route path="/account" element={<Page><AccountPage /></Page>} />
            <Route path="/versus" element={<Page><VersusPage /></Page>} />
            <Route path="/versus/:code" element={<Page><VersusRoomPage /></Page>} />
            <Route path="/lore" element={<Page><LorePage /></Page>} />
            <Route path="/cast" element={<Page><CastPage /></Page>} />
            <Route path="/settings" element={<Page><SettingsPage /></Page>} />
            <Route path="*" element={<Page><NotFoundPage /></Page>} />
          </Routes>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
