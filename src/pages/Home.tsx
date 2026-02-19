import React, { useEffect, useState } from "react";
import { apiMe } from "../app/auth";
import AvailabilityGrid from "../components/AvailabilityGrid";

class CalendarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; msg?: string }
> {
  state = { hasError: false as boolean, msg: undefined as string | undefined };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, msg: String(err?.message || err) };
  }

  componentDidCatch(err: any) {
    // visible in console for quick debug
    console.error("AvailabilityGrid crashed:", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur text-sm text-red-200">
          Erreur dans le calendrier : {this.state.msg}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiMe();
        setUsername(me.authenticated ? (me.username || null) : null);
      } catch (e: any) {
        setErr(e?.message || "Erreur auth");
        setUsername(null);
      }
    })();
  }, []);

  if (!username) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur text-sm">
        <div className="text-muted">Chargement…</div>
        {err && <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-200">{err}</div>}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
        <h2 className="text-lg font-semibold">Accueil</h2>
        <p className="mt-2 text-sm text-muted">
          Planning de disponibilités (17h → 23h) sur 4 semaines.
        </p>
      </div>

      <CalendarErrorBoundary>
        <AvailabilityGrid username={username} />
      </CalendarErrorBoundary>
    </div>
  );
}
