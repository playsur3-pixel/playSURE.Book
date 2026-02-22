import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import GridOverlay from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";

export default function Mirage() {
  const cols = 26;
  const rows = 20;

  const mapRef = useRef<HTMLDivElement>(null);

  // topbar height (measured)
  const [topbarH, setTopbarH] = useState(72);

  // Admin (Konami)
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [debugCoords, setDebugCoords] = useState(true);

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

  // 1) Disable page scroll completely on this page
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

  // 2) Measure topbar height automatically (header or data-topbar)
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

  // 3) Konami + ESC
  useEffect(() => {
    let buffer: string[] = [];

    const onKeyDown = (e: KeyboardEvent) => {
      // close with ESC
      if (e.key === "Escape") {
        setShowAdmin(false);
        return;
      }

      // ignore when typing
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;

      buffer.push(e.key);
      if (buffer.length > konamiSeq.length) buffer.shift();

      const ok = konamiSeq.every((k, i) => buffer[i] === k);
      if (ok) {
        setShowAdmin((v) => !v);
        setDebugCoords(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [konamiSeq]);

  // Stable square size: min(viewport width, available height below topbar)
  const squareSizeStyle = {
    width: `min(100vw, calc(100dvh - ${topbarH}px))`,
    height: `min(100vw, calc(100dvh - ${topbarH}px))`,
  } as const;

  return (
    <>
      {/* MAP full-fit under topbar */}
      <div className="fixed left-0 right-0 bottom-0 z-0" style={{ top: `${topbarH}px` }}>
        <div className="h-full w-full flex items-center justify-center">
          {/* clickable + measured area */}
          <div ref={mapRef} className="relative overflow-hidden bg-black/20" style={squareSizeStyle}>
            <img
              src="/maps/mirage.png"
              alt="Mirage overview"
              className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
              draggable={false}
            />

            {/* grid overlay (toggle from admin) */}
            <GridOverlay rows={rows} cols={cols} show={showGrid} />
          </div>
        </div>
      </div>

      {/* ADMIN DRAWER (Konami)
          IMPORTANT:
          - overlay is pointer-events-none (clicks pass through to map)
          - panel is pointer-events-auto (panel clickable)
      */}
      {showAdmin && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* visual backdrop only */}
          <div className="absolute inset-0 bg-black/60 pointer-events-none" />

          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-black/85 backdrop-blur border-l border-white/10 pointer-events-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="text-sm font-semibold text-white/90">Admin • Placement (Konami)</div>
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                onClick={() => setShowAdmin(false)}
              >
                Fermer
              </button>
            </div>

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
              <div className="mt-3 text-[11px] text-white/60">
                Astuce: Konami ↑↑↓↓←→←→ pour ouvrir/fermer • ESC pour fermer.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}