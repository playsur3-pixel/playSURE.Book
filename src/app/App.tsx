import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { apiLogout, apiMe, type Me } from "./auth";
import { Topbar } from "../components/Topbar";
import { Shell } from "../components/Shell";

export default function App() {
  const nav = useNavigate();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      const m = await apiMe();
      setMe(m);
      if (!m.authenticated) nav("/login");
    })();
  }, [nav]);

  async function logout() {
    await apiLogout();
    nav("/login");
  }

  if (!me) return null;
  if (!me.authenticated) return null;

  return (
    <div className="min-h-screen bg-bg bg-grid text-white">
      <Topbar username={me.username || "user"} onLogout={logout} />
      <Shell>
        <Outlet />
      </Shell>
    </div>
  );
}
