import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { ResultPage } from "../pages/ResultPage";

const apiGetMock = vi.fn();

vi.mock("../api/client", async () => {
  const actual = await vi.importActual("../api/client");
  return {
    ...actual,
    api: {
      get: (...args: unknown[]) => apiGetMock(...args),
    },
  };
});

describe("ResultPage and LeaderboardPage", () => {
  it("renders result data from the API", async () => {
    apiGetMock.mockResolvedValueOnce({
      data: {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        quizTitle: "JavaScript Arena Warmup",
        score: 20,
        totalPoints: 30,
        correctCount: 2,
        questionCount: 3,
        completionTimeSeconds: 95,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      },
    });

    render(
      <MemoryRouter
        initialEntries={["/attempts/attempt-1/result"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/attempts/:id/result" element={<ResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("JavaScript Arena Warmup")).toBeInTheDocument());
    expect(screen.getByText("01:35")).toBeInTheDocument();
    expect(screen.getByText("submitted")).toBeInTheDocument();
    expect(screen.queryByText("20/30")).not.toBeInTheDocument();
  });

  it("renders leaderboard entries from the API", async () => {
    apiGetMock.mockResolvedValueOnce({
      data: [
        {
          rank: 1,
          participantName: "Player One",
          score: 30,
          completionTimeSeconds: 70,
        },
      ],
    });

    render(
      <MemoryRouter
        initialEntries={["/quizzes/quiz-1/leaderboard"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/quizzes/:id/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Player One")).toBeInTheDocument());
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("01:10")).toBeInTheDocument();
  });
});
