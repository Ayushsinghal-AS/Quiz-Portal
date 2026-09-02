export type Role = "admin" | "participant";
export type QuizStatus = "draft" | "published";
export type AttemptStatus = "in_progress" | "submitted" | "auto_submitted";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: QuizStatus;
  questionCount: number;
  createdAt: string;
}

export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestionForParticipant {
  id: string;
  questionText: string;
  options: QuizQuestionOption[];
  points: number;
  order: number;
}

export interface QuizQuestionForAdmin extends QuizQuestionForParticipant {
  correctOptionId: string;
}

export interface QuizDetail {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: QuizStatus;
  createdAt: string;
  questions: QuizQuestionForParticipant[] | QuizQuestionForAdmin[];
}

export interface AttemptSession {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  expiresAt: string;
  startedAt: string;
  answers: Record<string, string>;
  questions: QuizQuestionForParticipant[];
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalPoints: number;
  correctCount: number;
  questionCount: number;
  completionTimeSeconds: number;
  status: AttemptStatus;
  submittedAt: string;
  leaderboardPublished: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  participantName: string;
  participantEmail: string;
  score: number;
  completionTimeSeconds: number;
}

export interface QuizAnalytics {
  quizId: string;
  quizTitle: string;
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completionRate: number;
  createdAt: string;
  publishedAt: string | null;
  leaderboard: LeaderboardEntry[];
  leaderboardPublished: boolean;
}

export interface LeaderboardPublishResponse {
  leaderboardPublished: boolean;
}

export interface ApiErrorResponse {
  message: string;
}

export interface AuthResponse {
  user: AuthUser;
  csrfToken: string;
}

export interface CsrfTokenResponse {
  csrfToken: string;
}

export interface MyAttemptResponse {
  attemptId: string;
  status: AttemptStatus;
}

export interface QuizFormInput {
  title: string;
  description: string;
  durationMinutes: number;
  status: QuizStatus;
}

export interface QuestionFormInput {
  questionText: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  points: number;
  order: number;
}
