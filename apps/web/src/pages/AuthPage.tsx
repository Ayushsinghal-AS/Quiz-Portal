import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";
import { loginUser, registerParticipant } from "../lib/authForms";

export const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const user =
        mode === "register"
          ? await registerParticipant({ name, email, password })
          : await loginUser({ email, password });
      setUser(user);
      navigate("/");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Participant Access</p>
        <h1 className="mt-4 font-display text-5xl uppercase text-white">
          {mode === "register" ? "Join the Arena" : "Welcome Back"}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-arena-100/75">
          Register as a participant to take published quizzes and compete on the leaderboard.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-full px-4 py-2 ${mode === "register" ? "bg-arena-400 text-black" : "border border-white/10 text-arena-100"}`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-full px-4 py-2 ${mode === "login" ? "bg-arena-400 text-black" : "border border-white/10 text-arena-100"}`}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          {mode === "register" ? (
            <label className="grid gap-2 text-sm text-arena-100">
              Name
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm text-arena-100">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            />
          </label>
          <label className="grid gap-2 text-sm text-arena-100">
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black disabled:opacity-70"
          >
            {submitting ? "Submitting..." : mode === "register" ? "Create Participant Account" : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
};
