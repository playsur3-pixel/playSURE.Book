import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import GridOverlay from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";

export default function Mirage() {
  const cols = 26;
  const rows = 20;

  // refs
  const mapRef = useRef<HTMLDivElement>(null);

  // page layout: measured topbar height (so we can be fixed with zero gap)
  const [topbarH, setTopbarH] = useState(72);

  // admin (Konami)
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [debugCoords, setDebugCoords] = useState(false);

  // Konami: ↑ ↑ ↓ ↓ ← → ← →
  const konamiSeq = useMemo(
    () => [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
    ],
    []
  );

  // 1) No scroll on this page (the drawer will scroll internally)
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // 2) Measure topbar height automatically
  useLayoutEffect(() => {
    const header =
      (document.querySelector("header") as HTMLElement | null) ||
      (document.querySelector('[data-topbar="true"]') as HTMLElement | null);

    if (!header) return;

    const update = () => setTopbarH(Math.ceil(header.getBoundingClientRect().height));
    update();

    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  // 3) Konami listener
  useEffect(() => {
    let buffer: string[] = [];

    const onKeyDown = (e: KeyboardEvent) => {
      // ignore typing contexts
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;

      buffer.push(e.key);
      if (buffer.length > konamiSeq.length) buffer.shift();

      const ok = konamiSeq.every((k, i) => buffer[i] === k);
      if (ok) {
        setShowAdmin((v) => !v);
        // open admin => enable debug by default (you can remove if you prefer)
        setDebugCoords(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [konamiSeq]);

  return (
    <>
      {/* FULL-FIT MAP AREA: fixed under topbar, no gap, no scroll */}
      <div className="fixed left-0 right-0 bottom-0" style={{ top: `${topbarH}px` }}>
        <div className="h-full w-full flex items-center justify-center">
          <div
            ref={mapRef}
            className="relative aspect-square h-full max-h-full w-auto max-w-full overflow-hidden bg-black/20"
          >
            <img
              src="/maps/mirage.png"
              alt="Mirage overview"
              className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
              draggable={false}
            />

            <GridOverlay rows={rows} cols={cols} show={showGrid} />
          </div>
        </div>
      </div>

      {/* ADMIN DRAWER (Konami) */}
      {showAdmin && (
        <div className="fixed inset-0 z-[999]">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAdmin(false)}
            aria-label="Fermer admin"
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-black/80 backdrop-blur border-l border-white/10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="text-sm font-semibold text-white/90">
                Admin • Placement (Konami)
              </div>
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                onClick={() => setShowAdmin(false)}
              >
                Fermer
              </button>
            </div>

            {/* Toggles */}
            <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setShowGrid((v) => !v)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
              >
                {showGrid ? "Masquer grille" : "Afficher grille"}
              </button>

              <button
                type="button"
                onClick={() => setDebugCoords((v) => !v)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
              >
                {debugCoords ? "Debug: ON" : "Debug: OFF"}
              </button>
            </div>

            {/* Scrollable content */}
            <div className="h-[calc(100%-96px)] overflow-auto p-4">
              <PlacementTool
                mapRef={mapRef}
                rows={rows}
                cols={cols}
                enabledFromParent={debugCoords}
                fitMode="contain"
                imageAspect={1}
                defaultStuffId="new-stuff"
                defaultTitle="New lineup"
                defaultType="smoke"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}