import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";
import { loginUser } from "../lib/authForms";

export const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const user = await loginUser({ email, password });
      if (user.role !== "admin") {
        setError("This account is not an admin");
        return;
      }
      setUser(user);
      navigate("/admin");
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Admin Booth</p>
        <h1 className="mt-4 font-display text-5xl uppercase text-white">Control the Arena</h1>
        <p className="mt-3 text-sm text-arena-100/75">
          Sign in with your admin account to create quizzes, manage questions, and inspect analytics.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm text-arena-100">
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            />
          </label>
          <label className="grid gap-2 text-sm text-arena-100">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black">
            Login as Admin
          </button>
        </form>
      </div>
    </section>
  );
};
