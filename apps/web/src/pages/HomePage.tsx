import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { QuizListItem } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";
import { SectionHeader } from "../components/SectionHeader";

export const HomePage = () => {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<QuizListItem[]>("/quizzes")
      .then((response) => setQuizzes(response.data))
      .catch((caught) => setError(getErrorMessage(caught)));
  }, []);

  return (
    <div className="score-grid">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="arena-shell rounded-[2rem] p-8 shadow-glow">
          <SectionHeader
            eyebrow="Portfolio MVP"
            title="Timed Quizzes. Real Scoreboard Energy."
            description="Challenge yourself with published quizzes, beat the countdown, and climb the leaderboard. QuizArena is built to demonstrate practical fullstack engineering with a product-ready presentation."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { label: "Published Quizzes", value: quizzes.length.toString().padStart(2, "0") },
              { label: "Leaderboard Sorting", value: "Score + Time" },
              { label: "Admin Insights", value: "Live Analytics" },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-arena-100/60">{item.label}</p>
                <p className="mt-3 font-display text-4xl text-arena-300">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="mt-6 text-sm text-red-300">{error}</p> : null}

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <article key={quiz.id} className="arena-shell rounded-[1.75rem] p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-arena-400/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-arena-300">
                  {quiz.status}
                </span>
                <span className="text-sm text-arena-100/70">{quiz.durationMinutes} min</span>
              </div>
              <h2 className="mt-4 font-display text-4xl uppercase text-white">{quiz.title}</h2>
              <p className="mt-3 text-sm text-arena-100/75">{quiz.description}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-arena-100/70">
                <span>{quiz.questionCount} questions</span>
                {quiz.status === "published" ? (
                  <Link
                    to={`/quizzes/${quiz.id}`}
                    className="rounded-full bg-arena-400 px-4 py-2 font-semibold text-black"
                  >
                    View Quiz
                  </Link>
                ) : (
                  <span className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-arena-100/70">
                    Unpublished
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
};
