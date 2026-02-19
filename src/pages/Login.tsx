import { useState } from "react";
import { apiLogin } from "../app/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await apiLogin(username, password);
      nav("/");
    } catch (e: any) {
      setErr(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

return (
  <div className="min-h-screen text-white">
    {/* Background image */}
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/assets/BG_Home.png')" }}
    >
      {/* Overlay (dark) + grid */}
      <div className="min-h-screen bg-bg/70 bg-grid">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-xl2 border border-border bg-card/70 p-5 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <h1 className="text-lg font-semibold">Connexion</h1>
            </div>

            <form onSubmit={submit} className="grid gap-3">
              <input
                value={username}
                onChange={(e) => setU(e.target.value)}
                className="rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-accent/60"
                placeholder="Pseudo"
                autoComplete="username"
              />
              <input
                value={password}
                onChange={(e) => setP(e.target.value)}
                type="password"
                className="rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-accent/60"
                placeholder="Mot de passe"
                autoComplete="current-password"
              />

              {err && (
                <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-200">
                  {err}
                </div>
              )}

              <button
                disabled={loading}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);

}
