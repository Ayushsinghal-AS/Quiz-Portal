import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { LeaderboardEntry, QuizDetail, QuizListItem } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";
import { formatSeconds } from "../lib/format";

export const LeaderboardPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      setQuiz(null);
      api
        .get<LeaderboardEntry[]>(`/quizzes/${id}/leaderboard`)
        .then((response) => setEntries(response.data))
        .catch((caught) => setError(getErrorMessage(caught)));
      api
        .get<QuizDetail>(`/quizzes/${id}`)
        .then((response) => setQuiz(response.data))
        .catch(() => undefined);
      return;
    }

    api
      .get<QuizListItem[]>("/quizzes")
      .then((response) => setQuizzes(response.data))
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [id]);

  const handleDownload = async () => {
    if (entries.length === 0) {
      return;
    }

    const XLSX = await import("xlsx");
    const rows = entries.map((entry) => ({
      Rank: entry.rank,
      "Student Name": entry.participantName,
      Email: entry.participantEmail,
      Score: entry.score,
      "Time Taken": formatSeconds(entry.completionTimeSeconds),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");
    const quizName = (quiz?.title ?? "quiz").replace(/[^a-z0-9]+/gi, "-");
    XLSX.writeFile(workbook, `${quizName}-leaderboard.xlsx`);
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Leaderboard</p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-display text-5xl uppercase text-white">
            {id ? quiz?.title ?? "Quiz Rankings" : "Select a Quiz"}
          </h1>
          {id ? (
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={entries.length === 0}
              className="rounded-full bg-arena-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              Download
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-arena-100/75">
          {id
            ? "Scores are ranked by total points first, then faster completion time."
            : "Open a quiz-specific leaderboard to compare participant results."}
        </p>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        {!id ? (
          <div className="mt-8 grid gap-4">
            {quizzes.map((quizItem) => (
              <Link
                key={quizItem.id}
                to={`/quizzes/${quizItem.id}/leaderboard`}
                state={{ from: location.pathname }}
                className="rounded-3xl border border-white/10 bg-black/15 px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{quizItem.title}</span>
                  <span className="text-sm text-arena-100/60">{quizItem.durationMinutes} min</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {entries.map((entry) => (
              <div
                key={`${entry.rank}-${entry.participantEmail}`}
                className="grid grid-cols-[64px_1fr_1fr_100px_100px] items-center gap-3 rounded-3xl border border-white/10 bg-black/15 px-5 py-4 text-sm"
              >
                <span className="font-display text-3xl text-arena-300">#{entry.rank}</span>
                <span className="font-semibold text-white">{entry.participantName}</span>
                <span className="truncate text-arena-100/60">{entry.participantEmail}</span>
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

