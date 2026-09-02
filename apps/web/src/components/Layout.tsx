import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api, setCsrfToken } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `inline-flex rounded-full px-4 py-2 transition ${isActive ? "bg-white/8 text-white" : "text-arena-100 hover:bg-white/5"}`;

  const handleLogout = async () => {
    await api.post("/auth/logout");
    setCsrfToken(null);
    setUser(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-black/10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0 font-display text-3xl tracking-[0.18em] text-arena-300 sm:text-4xl">
            QuizArena
          </Link>
          <nav className="flex w-full flex-wrap items-center gap-2 text-sm sm:w-auto sm:justify-end">
            <NavLink to="/" className={navLinkClassName}>
              Play
            </NavLink>
            <NavLink to="/leaderboard" className={navLinkClassName}>
              Leaderboards
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={navLinkClassName}>
                Admin
              </NavLink>
            )}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex rounded-full border border-arena-400/50 px-4 py-2 text-arena-100 transition hover:border-arena-300/70 hover:text-white"
              >
                Logout
              </button>
            ) : (
              <>
                <NavLink to="/auth" className={navLinkClassName}>
                  Participant
                </NavLink>
                <NavLink
                  to="/admin/login"
                  className="inline-flex rounded-full bg-arena-400 px-4 py-2 font-semibold text-black transition hover:bg-arena-300"
                >
                  Admin Login
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};
