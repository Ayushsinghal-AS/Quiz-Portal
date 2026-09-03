import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { LeaderboardPublishResponse, QuizAnalytics } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";

const formatDate = (value: string | null) => {
  if (!value) {
    return "Not published yet";
  }
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const AdminAnalyticsPage = () => {
  const { id = "" } = useParams();
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [error, setError] = useState("");
  const [publishBusy, setPublishBusy] = useState(false);

  useEffect(() => {
    api
      .get<QuizAnalytics>(`/quizzes/${id}/analytics`)
      .then((response) => setAnalytics(response.data))
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [id]);

  const handleToggleLeaderboardPublish = async () => {
    setPublishBusy(true);
    try {
      const response = await api.patch<LeaderboardPublishResponse>(`/quizzes/${id}/leaderboard-publish`);
      setAnalytics((prev) => (prev ? { ...prev, leaderboardPublished: response.data.leaderboardPublished } : prev));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPublishBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!analytics) {
      return;
    }

    const XLSX = await import("xlsx");
    const rows = analytics.leaderboard.map((entry) => ({
      Rank: entry.rank,
      Name: entry.participantName,
      Email: entry.participantEmail,
      Score: entry.score,
      "Time (seconds)": entry.completionTimeSeconds,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");
    XLSX.writeFile(workbook, `${analytics.quizTitle.replace(/[^a-z0-9]+/gi, "-")}-leaderboard.xlsx`);
  };

  if (error) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-red-300">{error}</div>;
  }

  if (!analytics) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-arena-100">Loading analytics...</div>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Admin Analytics</p>
            <h1 className="mt-4 font-display text-5xl uppercase text-white">{analytics.quizTitle}</h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-arena-100/70">
              <span>Created: {formatDate(analytics.createdAt)}</span>
              <span>Published: {formatDate(analytics.publishedAt)}</span>
            </div>
          </div>
          <Link
            to={`/admin/quizzes/${id}/edit`}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-arena-100"
          >
            Edit Quiz
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {[
            ["Participants", analytics.totalParticipants],
            ["Average", analytics.averageScore],
            ["Highest", analytics.highestScore],
            ["Lowest", analytics.lowestScore],
            ["Completion", `${analytics.completionRate}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-arena-100/60">{label}</p>
              <p className="mt-2 font-display text-4xl text-arena-300">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl uppercase text-white">Leaderboard</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-arena-100/60">
                {analytics.leaderboardPublished ? "Visible to students" : "Hidden from students"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleToggleLeaderboardPublish()}
                disabled={publishBusy}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  analytics.leaderboardPublished
                    ? "border border-arena-400/50 text-arena-100 hover:border-arena-300/70 hover:text-white"
                    : "bg-arena-400 text-black"
                }`}
              >
                {analytics.leaderboardPublished ? "Unpublish Leaderboard" : "Publish Leaderboard"}
              </button>
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={analytics.leaderboard.length === 0}
                className="rounded-full bg-arena-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Download Excel
              </button>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.25em] text-arena-100/60">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.leaderboard.map((entry) => (
                  <tr key={`${entry.rank}-${entry.participantEmail}`} className="border-t border-white/10">
                    <td className="py-3 font-display text-2xl text-arena-300">#{entry.rank}</td>
                    <td className="py-3 text-white">{entry.participantName}</td>
                    <td className="py-3 text-arena-100/75">{entry.participantEmail}</td>
                    <td className="py-3 text-arena-100/75">{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analytics.leaderboard.length === 0 ? (
              <p className="mt-4 text-sm text-arena-100/70">No submissions yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
