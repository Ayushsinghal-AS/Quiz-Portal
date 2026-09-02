import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";
import { registerParticipant } from "../lib/authForms";

export const AuthPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const user = await registerParticipant({ name, email });
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
        <h1 className="mt-4 font-display text-5xl uppercase text-white">Join the Arena</h1>
        <p className="mt-3 max-w-xl text-sm text-arena-100/75">
          Enter your name and email to take published quizzes.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
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
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black disabled:opacity-70"
          >
            {submitting ? "Submitting..." : "Create Participant Account"}
          </button>
        </form>
      </div>
    </section>
  );
};
