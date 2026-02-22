import { useEffect, useRef, useState } from "react";
import GridOverlay from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";

export default function Mirage() {
  const cols = 26;
  const rows = 20;

  // adapte si ta topbar est différente
  const TOPBAR_H = 72; // px

  const mapRef = useRef<HTMLDivElement>(null);

  const [showAdmin, setShowAdmin] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [debugCoords, setDebugCoords] = useState(false);

  // Konami: ↑ ↑ ↓ ↓ ← → ← →
  useEffect(() => {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight"];
    let buffer: string[] = [];

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement | null)?.isContentEditable) return;

      buffer.push(e.key);
      if (buffer.length > seq.length) buffer.shift();

      const ok = seq.every((k, i) => buffer[i] === k);
      if (ok) {
        setShowAdmin((v) => !v);
        // en ouvrant l'admin: debug on (tu peux enlever si tu veux)
        setDebugCoords(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="w-full">
      {/* Container sans scroll */}
      <div
        className="mx-auto w-full max-w-6xl px-4 pt-0 mt-0 overflow-hidden"
        style={{ height: `calc(100dvh - ${TOPBAR_H}px)`
        }
      }
      >
        {/* Carte unique */}
        <div className="h-full rounded-xl2 border border-border bg-card/40 shadow-soft backdrop-blur overflow-hidden">
          {/* Map zone full fit */}
          <div className="h-full w-full flex items-center justify-center p-3">
            <div
              ref={mapRef}
              className="relative aspect-square"
              style={{
                // maximum possible size inside the card WITHOUT scroll
                height: "100%",
                maxHeight: "100%",
                width: "auto",
              }}
            >
              {/* IMPORTANT: on force le carré à ne jamais dépasser la largeur dispo */}
              <div className="h-full aspect-square max-w-[calc(100vw-32px)]">
                <div className="relative h-full w-full overflow-hidden rounded-xl2 bg-black/20">
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
          </div>
        </div>
      </div>

      {/* ADMIN DRAWER (apparait seulement via Konami) */}
      {showAdmin && (
        <div className="fixed inset-0 z-[999]">
          {/* backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAdmin(false)}
            aria-label="Fermer admin"
          />

          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-black/80 backdrop-blur border-l border-white/10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="text-sm font-semibold text-white/90">Admin • Placement</div>
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                onClick={() => setShowAdmin(false)}
              >
                Fermer
              </button>
            </div>

            {/* toggles */}
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

            {/* scrollable content */}
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
    </div>
  );
}