import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ActiveAttemptResponse, QuizDetail } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../features/auth/AuthContext";

export const QuizDetailPage = () => {
  const { id = "" } = useParams();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [startError, setStartError] = useState("");
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api
      .get<QuizDetail>(`/quizzes/${id}`)
      .then((response) => setQuiz(response.data))
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [id]);

  useEffect(() => {
    if (user?.role !== "participant") {
      setActiveAttemptId(null);
      return;
    }

    api
      .get<ActiveAttemptResponse>(`/quizzes/${id}/active-attempt`)
      .then((response) => setActiveAttemptId(response.data.attemptId))
      .catch(() => setActiveAttemptId(null));
  }, [id, user]);

  const alreadyCompleted = startError.toLowerCase().includes("already completed");

  const handleStart = async () => {
    setStartError("");

    if (!user) {
      navigate("/auth");
      return;
    }

    if (user.role !== "participant") {
      return;
    }

    setStarting(true);
    try {
      const response = await api.post(`/quizzes/${id}/start`);
      navigate(`/attempts/${response.data.attemptId}/session`);
    } catch (caught) {
      setStartError(getErrorMessage(caught));
    } finally {
      setStarting(false);
    }
  };

  if (error) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-red-300">{error}</div>;
  }

  if (!quiz) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-arena-100">Loading quiz...</div>;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <span className="rounded-full bg-arena-400/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-arena-300">
          {quiz.status}
        </span>
        <h1 className="mt-4 font-display text-5xl uppercase text-white">{quiz.title}</h1>
        <p className="mt-4 max-w-3xl text-arena-100/80">{quiz.description}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-arena-100/60">Duration</p>
            <p className="mt-2 font-display text-4xl text-arena-300">{quiz.durationMinutes}m</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-arena-100/60">Questions</p>
            <p className="mt-2 font-display text-4xl text-arena-300">{quiz.questions.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-arena-100/60">Format</p>
            <p className="mt-2 font-display text-4xl text-arena-300">MCQ</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={starting || user?.role === "admin" || alreadyCompleted}
            className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {starting
              ? "Preparing..."
              : user?.role === "admin"
                ? "Participants Only"
                : alreadyCompleted
                  ? "Already Completed"
                  : "Start Quiz"}
          </button>
          {activeAttemptId ? (
            <button
              type="button"
              onClick={() => navigate(`/attempts/${activeAttemptId}/session`)}
              className="rounded-full border border-arena-300/40 px-5 py-3 text-arena-100"
            >
              Continue Attempt
            </button>
          ) : null}
          <Link to={`/quizzes/${id}/leaderboard`} className="rounded-full border border-white/10 px-5 py-3">
            View Leaderboard
          </Link>
        </div>
        {user?.role === "admin" ? (
          <p className="mt-4 text-sm text-arena-100/70">
            Admin accounts can preview published quizzes, but only participant accounts can start attempts.
          </p>
        ) : null}
        {startError ? (
          <p className="mt-4 text-sm text-red-300">
            {alreadyCompleted
              ? "You've already completed this quiz. Check the leaderboard above to see your result."
              : startError}
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4">
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="arena-shell rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-arena-100/60">Question {index + 1}</p>
            <h2 className="mt-3 text-lg font-semibold text-white">{question.questionText}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-arena-100"
                >
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
