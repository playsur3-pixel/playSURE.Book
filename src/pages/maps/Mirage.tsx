import { useEffect, useRef, useState } from "react";
import GridOverlay from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";

export default function Mirage() {
  const cols = 26;
  const rows = 20;

  const mapRef = useRef<HTMLDivElement>(null);

  // ✅ cachés par défaut
  const [showGrid, setShowGrid] = useState(false);
  const [debugCoords, setDebugCoords] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Konami: ↑ ↑ ↓ ↓ ← → ← →
  useEffect(() => {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight"];
    let buffer: string[] = [];

    const onKeyDown = (e: KeyboardEvent) => {
      // ignore si l'utilisateur tape dans un input/textarea
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement | null)?.isContentEditable) return;

      buffer.push(e.key);
      if (buffer.length > seq.length) buffer.shift();

      const ok = seq.every((k, i) => buffer[i] === k);
      if (ok) {
        setShowAdmin((v) => !v);
        // quand on ouvre admin, on active debug par défaut (optionnel)
        setDebugCoords(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
      <h2 className="text-xl font-semibold">Mirage</h2>
      <p className="mt-1 text-sm text-muted">
        Hover une smoke = preview. Clique une smoke = affiche le lancer. Clique le joueur = page détail.
      </p>

      {/* MAP */}
       <div className="flex justify-center p-4 w-full max-w-[900px]">
        <div
          ref={mapRef}
          className="relative aspect-square w-full
            max-w-[900px]
            h-auto
            overflow-hidden rounded-xl2 bg-black/30"
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

        {/* ADMIN PANEL (Konami) */}
        {showAdmin && (
          <div className="mt-3 rounded-xl2 border border-border/60 bg-card/40 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Mode admin (placement)</div>
                <div className="text-xs text-muted/80">
                  Konami: ↑ ↑ ↓ ↓ ← → ← → pour afficher/masquer
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGrid((v) => !v)}
                  className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
                >
                  {showGrid ? "Masquer grille" : "Afficher grille"}
                </button>

                <button
                  type="button"
                  onClick={() => setDebugCoords((v) => !v)}
                  className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
                >
                  {debugCoords ? "Debug: ON" : "Debug: OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAdmin(false)}
                  className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
                  title="Masquer le panneau admin"
                >
                  Fermer
                </button>
              </div>
            </div>

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
        )}
      </div>
  );
}