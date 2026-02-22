import React, { useEffect, useMemo, useState } from "react";
import { pctToGrid } from "./GridOverlay";

type Point = { x: number; y: number; grid: string };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/**
 * Calcule le rectangle (en pixels, relatif au conteneur) occupé par l'image
 * quand elle est affichée en object-contain.
 *
 * - containerW/H : taille du conteneur
 * - imageAspect : width/height de l'image (ex: 1 pour 1024x1024)
 */
function getContainRect(containerW: number, containerH: number, imageAspect: number) {
  const containerAspect = containerW / containerH;

  // image plus "large" que le conteneur -> on fit en largeur
  if (imageAspect > containerAspect) {
    const w = containerW;
    const h = w / imageAspect;
    const x = 0;
    const y = (containerH - h) / 2;
    return { x, y, w, h };
  }

  // image plus "haute" -> on fit en hauteur
  const h = containerH;
  const w = h * imageAspect;
  const y = 0;
  const x = (containerW - w) / 2;
  return { x, y, w, h };
}

export default function PlacementTool({
  mapRef,
  rows,
  cols,
  defaultType = "smoke",
  defaultStuffId = "new-stuff",
  defaultTitle = "New lineup",
  enabledFromParent,
  fitMode = "contain",
  imageAspect = 1,
}: {
  mapRef: React.RefObject<HTMLDivElement>;
  rows: number;
  cols: number;
  defaultType?: "smoke" | "flash" | "molotov" | "he";
  defaultStuffId?: string;
  defaultTitle?: string;
  enabledFromParent?: boolean;
  fitMode?: "contain"; // pour l’instant on gère contain (ton cas)
  imageAspect?: number; // width/height (1 pour 1024x1024)
}) {
  const storageKey = "playsure:miragePlacement";

  const [enabled, setEnabled] = useState(true);
  const [type, setType] = useState<"smoke" | "flash" | "molotov" | "he">(defaultType);
  const [stuffId, setStuffId] = useState(defaultStuffId);
  const [title, setTitle] = useState(defaultTitle);

  const [throwP, setThrowP] = useState<Point | null>(null);
  const [resultP, setResultP] = useState<Point | null>(null);

  // Restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setEnabled(parsed.enabled ?? true);
      setType(parsed.type ?? defaultType);
      setStuffId(parsed.stuffId ?? defaultStuffId);
      setTitle(parsed.title ?? defaultTitle);
      setThrowP(parsed.throwP ?? null);
      setResultP(parsed.resultP ?? null);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ enabled, type, stuffId, title, throwP, resultP })
      );
    } catch {
      // ignore
    }
  }, [enabled, type, stuffId, title, throwP, resultP]);

  // Click handler
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    const handler = (ev: MouseEvent) => {
      if (!enabled) return;
      if (enabledFromParent === false) return;
      if (ev.button !== 0) return;

      const rect = el.getBoundingClientRect();
      const localX = ev.clientX - rect.left;
      const localY = ev.clientY - rect.top;

      // Calcul de la zone "image" réelle (contain)
      let imgRect = { x: 0, y: 0, w: rect.width, h: rect.height };

      if (fitMode === "contain") {
        imgRect = getContainRect(rect.width, rect.height, imageAspect);
      }

      // Si tu cliques hors de l'image (dans les bandes noires), on ignore
      const inside =
        localX >= imgRect.x &&
        localX <= imgRect.x + imgRect.w &&
        localY >= imgRect.y &&
        localY <= imgRect.y + imgRect.h;

      if (!inside) {
        console.log("Click ignored (outside image)");
        return;
      }

      // % relatif à l'image (pas au conteneur)
      const xPct = ((localX - imgRect.x) / imgRect.w) * 100;
      const yPct = ((localY - imgRect.y) / imgRect.h) * 100;

      const x = +clamp(xPct, 0, 100).toFixed(2);
      const y = +clamp(yPct, 0, 100).toFixed(2);
      const grid = pctToGrid(x, y, rows, cols);

      const point: Point = { x, y, grid };

      if (ev.altKey) {
        setThrowP(point);
        console.log("Throw (ALT+click):", point);
      } else {
        setResultP(point);
        console.log("Result (click):", point);
      }
    };

    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [enabled, enabledFromParent, mapRef, rows, cols, fitMode, imageAspect]);

  const lineupId = useMemo(() => {
    const base = (stuffId.trim() || "new-stuff")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "");
    return `${base}-${stamp}`;
  }, [stuffId]);

  const snippet = useMemo(() => {
    if (!throwP || !resultP) return null;
    const safeStuffId = (stuffId || "new-stuff").trim();
    const safeTitle = (title || "New lineup").trim();

    return `{
  lineupId: "${lineupId}",
  stuffId: "${safeStuffId}",
  title: "${safeTitle}",
  type: "${type}",
  result: { x: ${resultP.x}, y: ${resultP.y} },
  throw: { x: ${throwP.x}, y: ${throwP.y} },
  previewImg: "/previews/mirage/${safeStuffId}.jpg",
},`;
  }, [throwP, resultP, lineupId, stuffId, title, type]);

  async function copySnippet() {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      console.log("✅ Snippet copied");
    } catch {
      console.log("❌ Clipboard blocked, copy manually.");
    }
  }

  function resetPoints() {
    setThrowP(null);
    setResultP(null);
  }

  function clearAll() {
    resetPoints();
    setStuffId(defaultStuffId);
    setTitle(defaultTitle);
    setType(defaultType);
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Mode placement</div>
          <div className="text-xs text-muted/80">
            ALT+clic = lancer • clic = arrivée • {cols}×{rows} • fit:{fitMode}
          </div>
          {enabledFromParent === false && (
            <div className="mt-1 text-[11px] text-amber-300/90">
              Debug OFF : les clics sur la map sont ignorés.
            </div>
          )}
          <div className="mt-1 text-[11px] text-muted/70">
            (Les clics dans les bandes noires sont ignorés)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
            onClick={() => setEnabled((v) => !v)}
            type="button"
          >
            {enabled ? "Désactiver" : "Activer"}
          </button>

          <button
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
            onClick={resetPoints}
            type="button"
          >
            Reset
          </button>

          <button
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
            onClick={clearAll}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs text-muted">stuffId</span>
          <input
            value={stuffId}
            onChange={(e) => setStuffId(e.target.value)}
            className="rounded-lg border border-border/60 bg-black/20 px-2 py-1.5 text-sm outline-none"
            placeholder="smokewindow"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted">Titre</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-border/60 bg-black/20 px-2 py-1.5 text-sm outline-none"
            placeholder="Smoke Window"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="rounded-lg border border-border/60 bg-black/20 px-2 py-1.5 text-sm outline-none"
          >
            <option value="smoke">smoke</option>
            <option value="flash">flash</option>
            <option value="molotov">molotov</option>
            <option value="he">he</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-black/20 p-2">
          <div className="text-xs text-muted">Throw (ALT+clic)</div>
          <div className="text-sm">{throwP ? `${throwP.grid} • x:${throwP.x} y:${throwP.y}` : "—"}</div>
        </div>

        <div className="rounded-lg border border-border/60 bg-black/20 p-2">
          <div className="text-xs text-muted">Result (clic)</div>
          <div className="text-sm">{resultP ? `${resultP.grid} • x:${resultP.x} y:${resultP.y}` : "—"}</div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-black/20 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted">Snippet à coller dans ton fichier data</div>
          <button
            type="button"
            onClick={copySnippet}
            disabled={!snippet}
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition disabled:opacity-50"
          >
            Copier
          </button>
        </div>

        <pre className="mt-2 whitespace-pre-wrap text-xs text-white/80">
          {snippet ?? "Définis les 2 points (ALT+clic + clic) pour générer le snippet."}
        </pre>
      </div>
    </div>
  );
}