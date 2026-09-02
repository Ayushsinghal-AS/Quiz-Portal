import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { QuizAnalytics } from "@quizarena/shared";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, getErrorMessage } from "../api/client";

export const AdminAnalyticsPage = () => {
  const { id = "" } = useParams();
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<QuizAnalytics>(`/quizzes/${id}/analytics`)
      .then((response) => setAnalytics(response.data))
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [id]);

  if (error) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-red-300">{error}</div>;
  }

  if (!analytics) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-arena-100">Loading analytics...</div>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Admin Analytics</p>
        <h1 className="mt-4 font-display text-5xl uppercase text-white">{analytics.quizTitle}</h1>
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
          <h2 className="font-display text-3xl uppercase text-white">Question Accuracy</h2>
          <div className="mt-6 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.questionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="questionText" stroke="#f7dfac" tick={{ fontSize: 12 }} />
                <YAxis stroke="#f7dfac" />
                <Tooltip />
                <Bar dataKey="correctAnswerRate" fill="#f08d49" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

