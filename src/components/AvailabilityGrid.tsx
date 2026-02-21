import { useEffect, useMemo, useRef, useState } from "react";
import { apiAvailabilityGet, apiAvailabilitySet, type AvailabilityData, type AvailabilitySlot } from "../app/auth";

// 17h -> 23h (dernier slot = 22-23)
const HOURS = [17, 18, 19, 20, 21, 22];
const WEEKS = 4;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function startOfWeekMondayAtNoon(d = new Date()) {
  const x = new Date(d);
  // midi local => évite les décalages DST/fuseau
  x.setHours(12, 0, 0, 0);
  const day = x.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // Mon=0
  x.setDate(x.getDate() - diff);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function dateKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  return `${y}-${m}-${da}`;
}

function slotKey(d: Date, hour: number) {
  return `${dateKeyLocal(d)}|${hour}`;
}

function dayLabelFR(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function rangeLabel(h: number) {
  return `${pad2(h)}–${pad2(h + 1)}`;
}

function emptyData(): AvailabilityData {
  return { version: 1, updatedAt: new Date().toISOString(), slots: {} };
}

export default function AvailabilityGrid({ username }: { username: string }) {
  const [data, setData] = useState<AvailabilityData>(emptyData());
  const dataRef = useRef<AvailabilityData>(data);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Saving UI (1 action at a time)
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingPct, setSavingPct] = useState(0);
  const [savingDone, setSavingDone] = useState(false);

  const queueRef = useRef<string[]>([]);
  const runningRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const week0 = useMemo(() => startOfWeekMondayAtNoon(new Date()), []);
  const weeks = useMemo(() => {
    return Array.from({ length: WEEKS }, (_, w) => {
      const start = addDays(week0, w * 7);
      const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      return { start, days, index: w };
    });
  }, [week0]);

  async function refresh() {
    setErr(null);
    const fresh = await apiAvailabilityGet();
    setData(fresh);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e: any) {
        setErr(e?.message || "Erreur chargement");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enqueueToggle(key: string) {
    queueRef.current.push(key);
    if (!runningRef.current) void processQueue();
  }

  async function processQueue() {
    runningRef.current = true;

    while (queueRef.current.length) {
      const key = queueRef.current.shift()!;

      // calcule sur la donnée la plus récente (anti stale)
      const current = dataRef.current || emptyData();
      const already = !!current.slots?.[key]?.a?.includes(username);
      const nextAvailable = !already;

      // UI progress ring
      setSavingKey(key);
      setSavingPct(0);
      setSavingDone(false);

      let pct = 0;
      const tick = setInterval(() => {
        pct = Math.min(90, pct + 7);
        setSavingPct(pct);
      }, 80);

      try {
        const j = await apiAvailabilitySet(key, nextAvailable);

        setData((prev) => {
          const base = prev || emptyData();
          const slots = { ...(base.slots || {}) } as Record<string, AvailabilitySlot>;

          if (j.slot) slots[j.slotKey] = j.slot;
          else delete slots[j.slotKey];

          return { version: 1, updatedAt: j.updatedAt || new Date().toISOString(), slots };
        });

        setSavingPct(100);
        setSavingDone(true);
        await new Promise((r) => setTimeout(r, 180));
      } catch (e: any) {
        setErr(e?.message || "Erreur sauvegarde");
      } finally {
        clearInterval(tick);
        setSavingKey(null);
        setSavingDone(false);
      }
    }

    // ✅ Reconciliation finale: garantit que la page reflète EXACTEMENT le serveur
    try {
      await refresh();
    } catch {}
    runningRef.current = false;
  }

  if (loading) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur text-sm text-muted">
        Chargement…
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:flex-1 md:min-w-0 rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
          <h2 className="text-lg font-semibold">Accueil</h2>
          <p className="mt-2 text-sm text-muted">Planning de disponibilités (17h → 23h) sur 4 semaines.</p>
        </div>

        <div className="text-[11px] text-white/50 md:text-right md:pl-4">
          maj: {new Date(data.updatedAt).toLocaleString("fr-FR")}
        </div>
      </div>

      {err && <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-200">{err}</div>}

      {weeks.map((w) => (
        <details key={w.index} open={w.index === 0} className="rounded-xl2 border border-border bg-card/40">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
            Semaine {w.index + 1} • {dayLabelFR(w.days[0])} → {dayLabelFR(w.days[6])}
          </summary>

          <div className="overflow-x-auto -mx-4 px-4 pb-3 pt-0 md:mx-0 md:px-3">
            <table className="min-w-[880px] w-full border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 w-20 rounded-xl2 border border-white/10 bg-card/70 px-2 py-2 text-left text-xs text-white/70 backdrop-blur">
                    Heure
                  </th>
                  {w.days.map((d) => (
                    <th key={dateKeyLocal(d)} className="px-1 text-left text-xs text-white/60">
                      {dayLabelFR(d)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {HOURS.map((h) => (
                  <tr key={h}>
                    <td className="sticky left-0 z-10 rounded-xl2 border border-white/10 bg-card/60 px-2 py-2 text-xs text-white/75 backdrop-blur">
                      {rangeLabel(h)}
                    </td>

                    {w.days.map((d) => {
                      const key = slotKey(d, h);
                      const names = data.slots?.[key]?.a || [];
                      const mine = names.includes(username);
                      const isSaving = savingKey === key;

                      return (
                        <td
                          key={key}
                          onClick={() => (!isSaving ? enqueueToggle(key) : undefined)}
                          className={[
                            "relative rounded-xl2 border px-2 py-2 align-top transition",
                            "border-white/10 bg-white/5 hover:bg-white/7",
                            mine ? "ring-1 ring-accent/50 bg-accent/10" : "",
                            isSaving ? "cursor-wait opacity-90" : "cursor-pointer",
                          ].join(" ")}
                        >
                          <div className="flex flex-wrap gap-1">
                            {names.map((n) => (
                              <span key={n} className="rounded-lg bg-white/10 px-2 py-1 text-[11px] text-white/85">
                                {n}
                              </span>
                            ))}
                          </div>

                          {isSaving && (
                            <div className="absolute right-2 top-2">
                              <div className="relative h-7 w-7">
                                <div
                                  className="absolute inset-0 rounded-full"
                                  style={{
                                    background: `conic-gradient(hsl(var(--accent)) ${savingPct * 3.6}deg, rgba(255,255,255,.12) 0deg)`,
                                  }}
                                />
                                <div className="absolute inset-[3px] rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-[10px]">
                                  {savingDone ? "✓" : `${savingPct}%`}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  );
}
