import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AttemptSession } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";
import { Countdown } from "../components/Countdown";

export const AttemptPage = () => {
  const { id = "" } = useParams();
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<AttemptSession>(`/attempts/${id}/session`)
      .then((response) => {
        setSession(response.data);
        setAnswers(response.data.answers);
        setRemainingSeconds(
          Math.max(0, Math.ceil((new Date(response.data.expiresAt).getTime() - Date.now()) / 1000)),
        );
      })
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [id]);

  const handleAnswer = async (questionId: string, selectedOptionId: string) => {
    if (!session) {
      return;
    }

    const nextAnswers = { ...answers, [questionId]: selectedOptionId };
    setAnswers(nextAnswers);
    setAutosaveState("saving");
    try {
      await api.post(`/attempts/${session.attemptId}/answer`, { questionId, selectedOptionId });
      setAutosaveState("saved");
    } catch (caught) {
      setAutosaveState("error");
      setError(getErrorMessage(caught));
    }
  };

  const handleSubmit = async () => {
    if (!session || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/attempts/${session.attemptId}/submit`);
      navigate(`/attempts/${session.attemptId}/result`);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-red-300">{error}</div>;
  }

  if (!session) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-arena-100">Loading attempt...</div>;
  }

  const answeredCount = session.questions.filter((question) => answers[question.id]).length;
  const progressPercent =
    session.questions.length === 0 ? 0 : Math.round((answeredCount / session.questions.length) * 100);
  const timeWarning = remainingSeconds > 0 && remainingSeconds <= 60;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-6">
          <Countdown
            expiresAt={session.expiresAt}
            onExpire={handleSubmit}
            onTick={(nextRemaining) => setRemainingSeconds(nextRemaining)}
          />
          <div className="arena-shell rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-arena-100/60">Quiz</p>
            <h1 className="mt-3 font-display text-4xl uppercase text-white">{session.quizTitle}</h1>
            <p className="mt-4 text-sm text-arena-100/70">
              Answer each question before the server timer closes your attempt.
            </p>
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-arena-100/60">
                <span>Progress</span>
                <span>{answeredCount}/{session.questions.length}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-arena-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <p className={`mt-4 text-sm ${timeWarning ? "text-red-200" : "text-arena-100/70"}`}>
              {timeWarning ? "Less than 60 seconds left. Finalize fast." : "Server timer is authoritative."}
            </p>
            <p className="mt-2 text-sm text-arena-100/70">
              Autosave:{" "}
              <span className={autosaveState === "error" ? "text-red-200" : "text-arena-300"}>
                {autosaveState === "saving"
                  ? "Saving..."
                  : autosaveState === "saved"
                    ? "Saved"
                    : autosaveState === "error"
                      ? "Failed"
                      : "Waiting for changes"}
              </span>
            </p>
            <div className="mt-6 grid grid-cols-5 gap-2">
              {session.questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => document.getElementById(`question-${question.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className={`rounded-xl px-0 py-2 text-sm ${
                    answers[question.id]
                      ? "bg-arena-400 text-black"
                      : "border border-white/10 text-arena-100"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-arena-400 px-5 py-3 font-semibold text-black"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </aside>

        <div className="grid gap-5">
          {session.questions.map((question, index) => (
            <article id={`question-${question.id}`} key={question.id} className="arena-shell rounded-[2rem] p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-arena-100/60">Question {index + 1}</p>
                <p className="text-sm text-arena-300">{question.points} pts</p>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{question.questionText}</h2>
              <div className="mt-5 grid gap-3">
                {question.options.map((option) => {
                  const active = answers[question.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleAnswer(question.id, option.id)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        active
                          ? "border-arena-400 bg-arena-400/15 text-white"
                          : "border-white/10 bg-black/15 text-arena-100"
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
