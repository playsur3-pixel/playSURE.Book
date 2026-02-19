import { useEffect, useState } from "react";
import { apiMe } from "../app/auth";
import AvailabilityGrid from "../components/AvailabilityGrid";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const me = await apiMe();
        setUsername(me.authenticated ? (me.username || null) : null);
      } catch (e: any) {
        console.error(e);
        setErr("Impossible de vérifier la session (apiMe).");
        setUsername(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur text-sm text-muted">
        Chargement…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl2 border border-border bg-red-500/10 p-6 shadow-soft backdrop-blur text-sm text-red-200">
        {err}
      </div>
    );
  }

  if (!username) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur text-sm text-muted">
        Session expirée. Recharge la page ou reconnecte-toi.
      </div>
    );
  }

  return <AvailabilityGrid username={username} />;
}
