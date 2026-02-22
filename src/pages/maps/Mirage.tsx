import { useMemo, useState, useRef } from "react";
import GridOverlay, { pctToGrid } from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";

export default function Mirage() {
  // Grille A-Z / 1-X
  const cols = 26; // A..Z
  const rows = 20; // 1..20 (change si tu veux)

  // Toggle grille + debug coords
  const [showGrid, setShowGrid] = useState(true);
  const [debugCoords, setDebugCoords] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);

  const help = useMemo(() => {
    return `Grid: ${cols} cols (A-Z), ${rows} rows (1-${rows})`;
  }, [cols, rows]);

  function onMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!debugCoords) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const grid = pctToGrid(xPct, yPct, rows, cols);

    // Copiable direct pour ton tableau de data
    const payload = {
      x: +xPct.toFixed(2),
      y: +yPct.toFixed(2),
      grid,
    };

    console.log("Mirage click:", payload);

    // Si tu veux copier auto dans le presse-papiers (optionnel)
    // navigator.clipboard?.writeText(JSON.stringify(payload));
  }

  return (
    <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mirage</h2>
          <p className="mt-1 text-sm text-muted">
            Overview + grille de placement. Clique sur la map pour logger des coordonnées.
          </p>
          <p className="mt-1 text-xs text-muted/80">{help}</p>
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
            title="Active/désactive le log des coordonnées au clic"
          >
            {debugCoords ? "Debug: ON" : "Debug: OFF"}
          </button>
        </div>
      </div>

      {/* Zone map */}
      <div className="mt-5 rounded-xl2 border border-border/60 bg-black/20 p-3">
        {/* 
          Important:
          - On fixe une hauteur max liée à l'écran (pour "fit" dans l'encart).
          - Le SVG est en object-contain => jamais déformé, toujours visible en entier.
        */}
        <div
          className="
            relative w-full
            h-[68vh] sm:h-[72vh]
            overflow-hidden rounded-xl2
            border border-border/50
            bg-black/30
          "
          onClick={onMapClick}
        >
          {/* Overview */}
          <img
            src="/maps/mirage.svg"
            alt="Mirage overview"
            className="absolute inset-0 h-full w-full object-contain select-none"
            draggable={false}
          />

          {/* Grille overlay */}
          <GridOverlay
            show={showGrid}
            rows={rows}
            cols={cols}
          />

          <PlacementTool mapRef={mapRef} rows={rows} cols={cols} />

          {/* 
            Ici plus tard:
            - icônes
            - flèches
            - hover preview
          */}
        </div>

        <div className="mt-2 text-xs text-muted/80">
          Astuce : active la grille, clique sur l’endroit voulu → récupère {`{ x, y, grid }`} dans la console.
        </div>
      </div>
    </div>
  );
}