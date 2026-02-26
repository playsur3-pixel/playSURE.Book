import { useEffect, useState } from "react";
import { apiMe } from "../app/auth";
import AvailabilityGrid from "../components/AvailabilityGrid";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const me = await apiMe();
      setUsername(me.authenticated ? (me.username || null) : null);
    })();
  }, []);

  if (!username) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur text-sm text-muted">
        Chargement…
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
        <h2 className="text-lg font-semibold">Dark Games Book</h2>
      </div>
      <AvailabilityGrid username={username} />
    </div>
  );
}
