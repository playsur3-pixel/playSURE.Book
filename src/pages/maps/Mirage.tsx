import { useRef, useState } from "react";
import GridOverlay from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";

export default function Mirage() {
  const cols = 26;
  const rows = 20;

  const mapRef = useRef<HTMLDivElement>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [debugCoords, setDebugCoords] = useState(true);

  return (
    <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mirage</h2>
          <p className="mt-1 text-sm text-muted">
            Placement sur PNG (object-contain) : ALT+clic = lancer • clic = arrivée.
          </p>
          <p className="mt-1 text-xs text-muted/80">
            Grid: {cols} cols (A-Z), {rows} rows (1-{rows})
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl2 border border-border/60 bg-black/20 p-3">
        {/* MAP */}
        <div
          ref={mapRef}
          className="relative w-full h-[72vh] overflow-hidden rounded-xl2 border border-border/50 bg-black/30"
        >
          <img
            src="/maps/mirage.png"
            srcSet="/maps/mirage_x2.png 2x"
            alt="Mirage overview"
            className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
            draggable={false}
          />

          <GridOverlay rows={rows} cols={cols} show={showGrid} />
        </div>

        {/* PANEL BAS */}
        <div className="mt-3 rounded-xl2 border border-border/60 bg-card/40 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Mode placement</div>
              <div className="text-xs text-muted/80">
                Les clics dans les bandes noires sont ignorés (contain).
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
                title="Active/désactive la capture des clics sur la map"
              >
                {debugCoords ? "Debug: ON" : "Debug: OFF"}
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
      </div>
    </div>
  );
}