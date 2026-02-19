import { useEffect, useMemo, useRef, useState } from "react";
import {
  apiAvailabilityGet,
  apiAvailabilitySet,
  type AvailabilityData,
  type AvailabilitySlot,
} from "../app/auth";

// ✅ 17..22 => dernier slot 22-23 (plus de 23-00)
const HOURS = [17, 18, 19, 20, 21, 22];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKeyLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function atNoon(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfWeekMonday(d: Date) {
  const x = atNoon(d);
  const day = x.getDay(); // 0=Sun..6=Sat
  const delta = day === 0 ? -6 : 1 - day; // -> Monday
  return addDays(x, delta);
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function formatWeekRange(monday: Date) {
  const sunday = addDays(monday, 6);
  const a = monday.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  const b = sunday.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  return `${a} → ${b}`;
}

function isMeAvailable(slot: AvailabilitySlot | undefined, me: string) {
  return !!slot?.a?.includes(me);
}

function nextStateForMe(slot: AvailabilitySlot | undefined, me: string) {
  return isMeAvailable(slot, me) ? ("clear" as const) : ("available" as const);
}

function SaveRing({ pct }: { pct: number }) {
  // cercle SVG
  const r = 10;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const dashoffset = c - dash;

  return (
    <div className="absolute right-2 top-2 grid h-7 w-7 place-items-center">
      <svg width="28" height="28" viewBox="0 0 28 28" className="rotate-[-90deg]">
        <circle cx="14" cy="14" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="none" />
        <circle
          cx="14"
          cy="14"
          r={r}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="3"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-[10px] text-white/80">{Math.round(pct)}%</div>
    </div>
  );
}

export default function AvailabilityGrid({ meUsername }: { meUsername: string }) {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // lock per slot
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  // progress % per slot
  const [progress, setProgress] = useState<Record<string, number>>({});
  const timers = useRef<Record<string, number>>({});

  const weeks = useMemo(() => {
    const monday = startOfWeekMonday(new Date());
    return Array.from({ length: 4 }).map((_, i) => addDays(monday, i * 7));
  }, []);

  async function refresh() {
    const res = await apiAvailabilityGet();
    setData({
      version: 1 as const,
      updatedAt: res.updatedAt,
      slots: res.slots || {},
    });
  }

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        await refresh();
      } catch (e: any) {
        setErr(e?.message || "Erreur chargement planning");
      }
    })();

    return () => {
      // clear intervals
      for (const id of Object.values(timers.current)) window.clearInterval(id);
      timers.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startProgress(slotKey: string) {
    setProgress((p) => ({ ...p, [slotKey]: 5 }));

    // monte jusqu'à 90% en attendant la réponse serveur
    const id = window.setInterval(() => {
      setProgress((p) => {
        const cur = p[slotKey] ?? 0;
        if (cur >= 90) return p;
        return { ...p, [slotKey]: Math.min(90, cur + Math.max(1, Math.round((90 - cur) * 0.15))) };
      });
    }, 120);

    timers.current[slotKey] = id;
  }

  function finishProgress(slotKey: string) {
    const id = timers.current[slotKey];
    if (id) window.clearInterval(id);
    delete timers.current[slotKey];

    setProgress((p) => ({ ...p, [slotKey]: 100 }));

    // retire l'indicateur après un court délai
    window.setTimeout(() => {
      setProgress((p) => {
        const copy = { ...p };
        delete copy[slotKey];
        return copy;
      });
    }, 450);
  }

  async function toggle(slotKey: string) {
    if (!data) return;
    if (saving[slotKey]) return;

    const currentSlot = data.slots[slotKey];
    const next = nextStateForMe(currentSlot, meUsername); // available | clear

    setSaving((s) => ({ ...s, [slotKey]: true }));
    startProgress(slotKey);

    // optimistic update (functional)
    setData((prev) => {
      if (!prev) return prev;

      const nextData: AvailabilityData = {
        version: 1 as const,
        updatedAt: prev.updatedAt,
        slots: { ...prev.slots },
      };

      const cur = nextData.slots[slotKey] ?? { a: [] };
      const a = new Set(cur.a);

      a.delete(meUsername);
      if (next === "available") a.add(meUsername);

      const newSlot = { a: Array.from(a) };
      if (newSlot.a.length === 0) delete nextData.slots[slotKey];
      else nextData.slots[slotKey] = newSlot;

      return nextData;
    });

    try {
      const res = await apiAvailabilitySet(slotKey, next);

      // apply server-confirmed
      setData((prev) => {
        if (!prev) return prev;

        const nextData: AvailabilityData = {
          version: 1 as const,
          updatedAt: new Date().toISOString(),
          slots: { ...prev.slots },
        };

        if (!res.slot?.a?.length) delete nextData.slots[slotKey];
        else nextData.slots[slotKey] = res.slot;

        return nextData;
      });

      finishProgress(slotKey);
    } catch (e: any) {
      setErr(e?.message || "Erreur sauvegarde");
      // resync
      try {
        await refresh();
      } catch {}
    } finally {
      setSaving((s) => {
        const copy = { ...s };
        delete copy[slotKey];
        return copy;
      });
    }
  }

  if (err) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur text-sm text-red-200">
        {err}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur text-sm text-muted">
        Chargement du planning…
      </div>
    );
  }

  const WeekTable = ({ monday }: { monday: Date }) => {
    const days = Array.from({ length: 7 }).map((_, di) => addDays(monday, di));

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="w-24 px-3 py-2 text-left text-xs font-semibold text-muted">Heure</th>
              {days.map((d) => (
                <th key={dateKeyLocal(d)} className="px-3 py-2 text-left text-xs font-semibold text-muted">
                  {formatDayLabel(d)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {HOURS.map((h) => (
              <tr key={h} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2 align-top text-xs text-muted">
                  {pad(h)}h–{pad(h + 1)}h
                </td>

                {days.map((d) => {
                  const slotKey = `${dateKeyLocal(d)}|${pad(h)}`;
                  const slot = data.slots[slotKey];
                  const meOk = isMeAvailable(slot, meUsername);
                  const isSaving = !!saving[slotKey];
                  const pct = progress[slotKey];

                  const title = `SlotKey: ${slotKey}\nDispo: ${(slot?.a || []).join(", ") || "-"}`;

                  const cellBase = "relative w-[12.5%] select-none px-3 py-2 align-top text-xs transition";
                  const cellState = isSaving ? "opacity-60 pointer-events-none" : "cursor-pointer";
                  const cellRing = meOk
                    ? "bg-accent/10 ring-1 ring-accent/60"
                    : "hover:bg-white/5 ring-1 ring-white/10";

                  return (
                    <td
                      key={slotKey}
                      title={title}
                      onClick={() => toggle(slotKey)}
                      className={`${cellBase} ${cellState} ${cellRing}`}
                    >
                      {typeof pct === "number" && <SaveRing pct={pct} />}

                      {slot?.a?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {slot.a.slice(0, 6).map((u) => (
                            <span key={u} className="rounded-lg bg-accent/20 px-2 py-0.5 text-[11px] text-white">
                              {u}
                            </span>
                          ))}
                          {slot.a.length > 6 && (
                            <span className="rounded-lg bg-accent/10 px-2 py-0.5 text-[11px] text-muted">
                              +{slot.a.length - 6}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Disponibilités</h3>
            <p className="mt-1 text-xs text-muted">
              Clic = ajouter / retirer ta dispo. Plage 17h–23h (dernier slot 22–23), sur 4 semaines.
            </p>
          </div>
          <div className="text-xs text-muted">
            Connecté : <span className="text-white/90">@{meUsername}</span>
          </div>
        </div>
      </div>

      {weeks.map((monday, wi) => {
        if (wi === 0) {
          return (
            <div key={wi} className="overflow-hidden rounded-xl2 border border-border bg-card/60 shadow-soft backdrop-blur">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="font-semibold">Semaine {wi + 1}</div>
                <div className="text-xs text-muted">{formatWeekRange(monday)}</div>
              </div>
              <WeekTable monday={monday} />
            </div>
          );
        }

        return (
          <details key={wi} className="overflow-hidden rounded-xl2 border border-border bg-card/60 shadow-soft backdrop-blur">
            <summary className="cursor-pointer list-none border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Semaine {wi + 1}</div>
                <div className="text-xs text-muted">{formatWeekRange(monday)}</div>
              </div>
            </summary>
            <WeekTable monday={monday} />
          </details>
        );
      })}
    </div>
  );
}
