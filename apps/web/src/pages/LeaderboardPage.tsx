import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { LeaderboardEntry, QuizListItem } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";
import { formatSeconds } from "../lib/format";

export const LeaderboardPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      api
        .get<LeaderboardEntry[]>(`/quizzes/${id}/leaderboard`)
        .then((response) => setEntries(response.data))
        .catch((caught) => setError(getErrorMessage(caught)));
      return;
    }

    api
      .get<QuizListItem[]>("/quizzes")
      .then((response) => setQuizzes(response.data))
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [id]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Leaderboard</p>
        <h1 className="mt-4 font-display text-5xl uppercase text-white">
          {id ? "Quiz Rankings" : "Select a Quiz"}
        </h1>
        <p className="mt-3 text-sm text-arena-100/75">
          {id
            ? "Scores are ranked by total points first, then faster completion time."
            : "Open a quiz-specific leaderboard to compare participant results."}
        </p>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        {!id ? (
          <div className="mt-8 grid gap-4">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                to={`/quizzes/${quiz.id}/leaderboard`}
                state={{ from: location.pathname }}
                className="rounded-3xl border border-white/10 bg-black/15 px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{quiz.title}</span>
                  <span className="text-sm text-arena-100/60">{quiz.durationMinutes} min</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {entries.map((entry) => (
              <div
                key={`${entry.rank}-${entry.participantName}`}
                className="grid grid-cols-[64px_1fr_120px_120px] items-center rounded-3xl border border-white/10 bg-black/15 px-5 py-4 text-sm"
              >
                <span className="font-display text-3xl text-arena-300">#{entry.rank}</span>
                <span className="font-semibold text-white">{entry.participantName}</span>
                <span className="text-arena-100/75">{entry.score} pts</span>
                <span className="text-arena-100/75">{formatSeconds(entry.completionTimeSeconds)}</span>
              </div>
            ))}
            {entries.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-white/10 px-5 py-6 text-sm text-arena-100/70">
                No submissions yet.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
};

