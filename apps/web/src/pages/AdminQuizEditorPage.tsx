import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  QuestionFormInput,
  QuizQuestionForParticipant,
  QuizDetail,
  QuizFormInput,
  QuizQuestionForAdmin,
} from "@quizarena/shared";
import { api, getErrorMessage } from "../api/client";

const defaultQuiz: QuizFormInput = {
  title: "",
  description: "",
  durationMinutes: 10,
  status: "draft",
};

const createBlankQuestion = (order: number): QuestionFormInput => ({
  questionText: "",
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
  correctOptionId: "a",
  points: 10,
  order,
});

export const AdminQuizEditorPage = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState<QuizFormInput>(defaultQuiz);
  const [questions, setQuestions] = useState<QuizQuestionForAdmin[]>([]);
  const [draftQuestion, setDraftQuestion] = useState<QuestionFormInput>(createBlankQuestion(1));
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionFormInput>(createBlankQuestion(1));
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadQuiz = async (quizId: string) => {
    const response = await api.get<QuizDetail>(`/quizzes/${quizId}`);
    const quizDetail = response.data;
    setQuiz({
      title: quizDetail.title,
      description: quizDetail.description,
      durationMinutes: quizDetail.durationMinutes,
      status: quizDetail.status,
    });
    setQuestions(quizDetail.questions as QuizQuestionForAdmin[]);
    setDraftQuestion(createBlankQuestion(quizDetail.questions.length + 1));
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    api
      .get<QuizDetail>(`/quizzes/${id}`)
      .then((response) => {
        const quizDetail = response.data;
        setQuiz({
          title: quizDetail.title,
          description: quizDetail.description,
          durationMinutes: quizDetail.durationMinutes,
          status: quizDetail.status,
        });
        setQuestions(quizDetail.questions as QuizQuestionForAdmin[]);
        setDraftQuestion(createBlankQuestion(quizDetail.questions.length + 1));
      })
      .catch((caught) => setError(getErrorMessage(caught)));
  }, [id]);

  const saveQuiz = async () => {
    try {
      if (id) {
        await api.put(`/quizzes/${id}`, quiz);
      } else {
        const response = await api.post<QuizDetail>("/quizzes", quiz);
        navigate(`/admin/quizzes/${response.data.id}/edit`);
      }
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  const addQuestion = async () => {
    if (!id) {
      setError("Save the quiz before adding questions");
      return;
    }

    try {
      await api.post(`/quizzes/${id}/questions`, draftQuestion);
      await loadQuiz(id);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  const deleteQuestion = async (questionId: string) => {
    await api.delete(`/questions/${questionId}`);
    if (id) {
      await loadQuiz(id);
    }
  };

  const startEditingQuestion = (question: QuizQuestionForAdmin) => {
    setEditingQuestionId(question.id);
    setEditingQuestion({
      questionText: question.questionText,
      options: question.options.map((option) => ({ ...option })),
      correctOptionId: question.correctOptionId,
      points: question.points,
      order: question.order,
    });
  };

  const saveEditedQuestion = async () => {
    if (!editingQuestionId) {
      return;
    }

    try {
      await api.put(`/questions/${editingQuestionId}`, editingQuestion);
      setEditingQuestionId(null);
      if (id) {
        await loadQuiz(id);
      }
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="arena-shell rounded-[2rem] p-8">
          <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Quiz Builder</p>
          <h1 className="mt-4 font-display text-5xl uppercase text-white">
            {id ? "Edit Quiz" : "Create New Quiz"}
          </h1>
          <div className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm text-arena-100">
              Title
              <input
                value={quiz.title}
                onChange={(event) => setQuiz((current) => ({ ...current, title: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2 text-sm text-arena-100">
              Description
              <textarea
                value={quiz.description}
                onChange={(event) => setQuiz((current) => ({ ...current, description: event.target.value }))}
                className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-arena-100">
                Duration (minutes)
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={quiz.durationMinutes}
                  onChange={(event) =>
                    setQuiz((current) => ({ ...current, durationMinutes: Number(event.target.value) }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="grid gap-2 text-sm text-arena-100">
                Status
                <select
                  value={quiz.status}
                  onChange={(event) =>
                    setQuiz((current) => ({
                      ...current,
                      status: event.target.value as QuizFormInput["status"],
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <button type="button" onClick={() => void saveQuiz()} className="rounded-full bg-arena-400 px-5 py-3 font-semibold text-black">
              Save Quiz
            </button>
          </div>
        </div>

        <div className="arena-shell rounded-[2rem] p-8">
          <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Question Composer</p>
          <h2 className="mt-4 font-display text-4xl uppercase text-white">Add Question</h2>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm text-arena-100">
              Question Text
              <textarea
                value={draftQuestion.questionText}
                onChange={(event) =>
                  setDraftQuestion((current) => ({ ...current, questionText: event.target.value }))
                }
                className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              />
            </label>
            {draftQuestion.options.map((option, index) => (
              <label key={option.id} className="grid gap-2 text-sm text-arena-100">
                Option {index + 1}
                <input
                  value={option.text}
                  onChange={(event) =>
                    setDraftQuestion((current) => ({
                      ...current,
                      options: current.options.map((item) =>
                        item.id === option.id ? { ...item, text: event.target.value } : item,
                      ),
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
            ))}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm text-arena-100">
                Correct Option
                <select
                  value={draftQuestion.correctOptionId}
                  onChange={(event) =>
                    setDraftQuestion((current) => ({ ...current, correctOptionId: event.target.value }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                >
                  {draftQuestion.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.id.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-arena-100">
                Points
                <input
                  type="number"
                  min={1}
                  value={draftQuestion.points}
                  onChange={(event) =>
                    setDraftQuestion((current) => ({ ...current, points: Number(event.target.value) }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
              <label className="grid gap-2 text-sm text-arena-100">
                Order
                <input
                  type="number"
                  min={1}
                  value={draftQuestion.order}
                  onChange={(event) =>
                    setDraftQuestion((current) => ({ ...current, order: Number(event.target.value) }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                />
              </label>
            </div>
            <button type="button" onClick={() => void addQuestion()} className="rounded-full border border-white/10 px-5 py-3">
              Add Question
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {questions.map((question) => (
          <div key={question.id} className="arena-shell rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              {editingQuestionId === question.id ? (
                <div className="grid w-full gap-4">
                  <label className="grid gap-2 text-sm text-arena-100">
                    Question Text
                    <textarea
                      value={editingQuestion.questionText}
                      onChange={(event) =>
                        setEditingQuestion((current) => ({ ...current, questionText: event.target.value }))
                      }
                      className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                    />
                  </label>
                  {(editingQuestion.options as QuizQuestionForParticipant["options"]).map((option, index) => (
                    <label key={option.id} className="grid gap-2 text-sm text-arena-100">
                      Option {index + 1}
                      <input
                        value={option.text}
                        onChange={(event) =>
                          setEditingQuestion((current) => ({
                            ...current,
                            options: current.options.map((item) =>
                              item.id === option.id ? { ...item, text: event.target.value } : item,
                            ),
                          }))
                        }
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                      />
                    </label>
                  ))}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="grid gap-2 text-sm text-arena-100">
                      Correct Option
                      <select
                        value={editingQuestion.correctOptionId}
                        onChange={(event) =>
                          setEditingQuestion((current) => ({
                            ...current,
                            correctOptionId: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                      >
                        {editingQuestion.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.id.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm text-arena-100">
                      Points
                      <input
                        type="number"
                        min={1}
                        value={editingQuestion.points}
                        onChange={(event) =>
                          setEditingQuestion((current) => ({ ...current, points: Number(event.target.value) }))
                        }
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-arena-100">
                      Order
                      <input
                        type="number"
                        min={1}
                        value={editingQuestion.order}
                        onChange={(event) =>
                          setEditingQuestion((current) => ({ ...current, order: Number(event.target.value) }))
                        }
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void saveEditedQuestion()}
                      className="rounded-full bg-arena-400 px-4 py-2 font-semibold text-black"
                    >
                      Save Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingQuestionId(null)}
                      className="rounded-full border border-white/10 px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-arena-100/60">Question {question.order}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{question.questionText}</h3>
                    <p className="mt-3 text-sm text-arena-100/70">
                      Correct option: {question.correctOptionId.toUpperCase()} | Points: {question.points}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => startEditingQuestion(question)}
                      className="rounded-full border border-white/10 px-4 py-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteQuestion(question.id)}
                      className="rounded-full border border-red-400/40 px-4 py-2 text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
