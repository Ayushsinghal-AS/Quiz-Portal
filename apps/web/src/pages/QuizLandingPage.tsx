import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { MyAttemptResponse, QuizDetail } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";
import { registerParticipant } from "../lib/authForms";

export const QuizLandingPage = () => {
  const { id = "" } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState<MyAttemptResponse | null>(null);

  useEffect(() => {
    api
      .get<QuizDetail>(`/quizzes/${id}`)
      .then((response) => setQuiz(response.data))
      .catch((caught) => setLoadError(getErrorMessage(caught)));
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== "participant") {
      return;
    }
    api
      .get<MyAttemptResponse>(`/quizzes/${id}/my-attempt`)
      .then((response) => setAttempt(response.data))
      .catch(() => setAttempt(null));
  }, [id, user]);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const registeredUser = await registerParticipant({ name, email });
      setUser(registeredUser);
    } catch (caught) {
      setFormError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    setBusy(true);
    setFormError("");
    try {
      const response = await api.post(`/quizzes/${id}/start`);
      navigate(`/attempts/${response.data.attemptId}/session`);
      return;
    } catch (caught) {
      try {
        const mine = await api.get<MyAttemptResponse>(`/quizzes/${id}/my-attempt`);
        setAttempt(mine.data);
        navigate(
          mine.data.status === "in_progress"
            ? `/attempts/${mine.data.attemptId}/session`
            : `/attempts/${mine.data.attemptId}/result`,
        );
        return;
      } catch {
        setFormError(getErrorMessage(caught));
      }
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-red-300">{loadError}</div>;
  }

  if (!quiz) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-arena-100">Loading quiz...</div>;
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Quiz Invite</p>
        <h1 className="mt-4 font-display text-5xl uppercase text-white">{quiz.title}</h1>
        <p className="mt-3 text-sm text-arena-100/75">{quiz.description}</p>
        <div className="mt-4 flex gap-4 text-sm text-arena-100/60">
          <span>{quiz.durationMinutes} min</span>
          <span>{quiz.questions.length} questions</span>
        </div>

        {!user ? (
          <form onSubmit={handleRegister} className="mt-8 grid gap-4">
            <p className="text-sm text-arena-100/75">Enter your name and email to join this quiz.</p>
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
            {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black disabled:opacity-70"
            >
              {submitting ? "Joining..." : "Continue"}
            </button>
          </form>
        ) : user.role === "admin" ? (
          <p className="mt-8 rounded-3xl border border-dashed border-white/10 px-5 py-6 text-sm text-arena-100/70">
            You are signed in as an admin. Log in as a participant to take this quiz.
          </p>
        ) : (
          <div className="mt-8">
            {formError ? <p className="mb-4 text-sm text-red-300">{formError}</p> : null}
            {attempt?.status === "in_progress" ? (
              <button
                type="button"
                onClick={() => navigate(`/attempts/${attempt.attemptId}/session`)}
                className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black"
              >
                Continue Attempt
              </button>
            ) : attempt?.status === "submitted" || attempt?.status === "auto_submitted" ? (
              <button
                type="button"
                onClick={() => navigate(`/attempts/${attempt.attemptId}/result`)}
                className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black"
              >
                View Result
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={busy}
                className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black disabled:opacity-70"
              >
                {busy ? "Preparing..." : "Start Quiz"}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
