import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { AttemptResult } from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";
import { formatSeconds } from "../lib/format";

export const ResultPage = () => {
  const { id = "" } = useParams();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<AttemptResult>(`/attempts/${id}/result`)
      .then((response) => setResult(response.data))
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [id]);

  if (error) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-red-300">{error}</div>;
  }

  if (!result) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-arena-100">Loading result...</div>;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="arena-shell rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Final Score</p>
        <h1 className="mt-4 font-display text-5xl uppercase text-white">{result.quizTitle}</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-arena-100/60">Time</p>
            <p className="mt-2 font-display text-4xl text-arena-300">{formatSeconds(result.completionTimeSeconds)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-arena-100/60">Status</p>
            <p className="mt-2 font-display text-4xl text-arena-300">{result.status}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black">
            Back to Quiz List
          </Link>
        </div>
      </div>
    </section>
  );
};

