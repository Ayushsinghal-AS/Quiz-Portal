import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Layout } from "../components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthProvider } from "../features/auth/AuthContext";

const HomePage = lazy(() => import("../pages/HomePage").then((module) => ({ default: module.HomePage })));
const AuthPage = lazy(() => import("../pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const QuizLandingPage = lazy(() =>
  import("../pages/QuizLandingPage").then((module) => ({ default: module.QuizLandingPage })),
);
const AdminLoginPage = lazy(() =>
  import("../pages/AdminLoginPage").then((module) => ({ default: module.AdminLoginPage })),
);
const LeaderboardPage = lazy(() =>
  import("../pages/LeaderboardPage").then((module) => ({ default: module.LeaderboardPage })),
);
const AttemptPage = lazy(() =>
  import("../pages/AttemptPage").then((module) => ({ default: module.AttemptPage })),
);
const ResultPage = lazy(() =>
  import("../pages/ResultPage").then((module) => ({ default: module.ResultPage })),
);
const AdminDashboardPage = lazy(() =>
  import("../pages/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })),
);
const AdminQuizEditorPage = lazy(() =>
  import("../pages/AdminQuizEditorPage").then((module) => ({ default: module.AdminQuizEditorPage })),
);
const AdminAnalyticsPage = lazy(() =>
  import("../pages/AdminAnalyticsPage").then((module) => ({ default: module.AdminAnalyticsPage })),
);

export const App = () => (
  <AuthProvider>
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<div className="p-8 text-center text-arena-100">Loading arena...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/quizzes/:id" element={<QuizLandingPage />} />
            <Route element={<ProtectedRoute role="participant" />}>
              <Route path="/attempts/:id/session" element={<AttemptPage />} />
              <Route path="/attempts/:id/result" element={<ResultPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/quizzes/:id/leaderboard" element={<LeaderboardPage />} />
            </Route>
            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/quizzes/new" element={<AdminQuizEditorPage />} />
              <Route path="/admin/quizzes/:id/edit" element={<AdminQuizEditorPage />} />
              <Route path="/admin/quizzes/:id/analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  </AuthProvider>
);
