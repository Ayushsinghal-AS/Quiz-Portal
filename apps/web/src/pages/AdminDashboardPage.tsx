import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { QuizListItem } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";

export const AdminDashboardPage = () => {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [error, setError] = useState("");

  const load = () => {
    api
      .get<QuizListItem[]>("/quizzes")
      .then((response) => setQuizzes(response.data))
      .catch((caught) => setError(getErrorMessage(caught)));
  };

  useEffect(load, []);

  const togglePublish = async (quizId: string) => {
    await api.patch(`/quizzes/${quizId}/publish`);
    load();
  };

  const deleteQuiz = async (quizId: string) => {
    await api.delete(`/quizzes/${quizId}`);
    load();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Admin Dashboard</p>
          <h1 className="mt-4 font-display text-5xl uppercase text-white">Build the Quiz Grid</h1>
        </div>
        <Link to="/admin/quizzes/new" className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black">
          Create Quiz
        </Link>
      </div>

      {error ? <p className="mt-6 text-sm text-red-300">{error}</p> : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {quizzes.map((quiz) => (
          <article key={quiz.id} className="arena-shell rounded-[2rem] p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-arena-400/15 px-3 py-1 text-xs uppercase tracking-[0.25em] text-arena-300">
                {quiz.status}
              </span>
              <span className="text-sm text-arena-100/70">{quiz.questionCount} questions</span>
            </div>
            <h2 className="mt-4 font-display text-4xl uppercase text-white">{quiz.title}</h2>
            <p className="mt-3 text-sm text-arena-100/75">{quiz.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/admin/quizzes/${quiz.id}/edit`} className="rounded-full border border-white/10 px-4 py-2">
                Edit
              </Link>
              <Link to={`/admin/quizzes/${quiz.id}/analytics`} className="rounded-full border border-white/10 px-4 py-2">
                Analytics
              </Link>
              <button
                type="button"
                onClick={() => void togglePublish(quiz.id)}
                className="rounded-full bg-arena-400 px-4 py-2 font-semibold text-black"
              >
                {quiz.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => void deleteQuiz(quiz.id)}
                className="rounded-full border border-red-400/40 px-4 py-2 text-red-200"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

