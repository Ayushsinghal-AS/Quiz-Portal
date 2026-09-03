import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import spanideaLogo from "../assets/spanidea-logo.svg";
import { api, setCsrfToken } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tabClassName = (isActive: boolean) =>
    `inline-flex rounded-full px-4 py-2 font-semibold transition ${
      isActive
        ? "bg-arena-400 text-black shadow-glow"
        : "text-arena-100 hover:bg-white/10 hover:text-white"
    }`;
  const navLinkClassName = ({ isActive }: { isActive: boolean }) => tabClassName(isActive);
  const isLeaderboardTabActive = /^\/(leaderboard|quizzes\/.+\/leaderboard)/.test(location.pathname);

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
          <Link to="/" className="shrink-0">
            <img src={spanideaLogo} alt="Spanidea" className="h-8 w-auto brightness-0 invert sm:h-10" />
          </Link>
          <nav className="flex w-full flex-wrap items-center gap-2 text-sm sm:w-auto sm:justify-end">
            <NavLink to="/" end className={navLinkClassName}>
              Play
            </NavLink>
            {user?.role === "admin" && (
              <Link to="/leaderboard" className={tabClassName(isLeaderboardTabActive)}>
                Leaderboards
              </Link>
            )}
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
              <NavLink to="/auth" className={navLinkClassName}>
                Participant
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};
