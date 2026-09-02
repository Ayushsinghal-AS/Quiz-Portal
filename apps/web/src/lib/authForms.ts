import type { AuthResponse, AuthUser } from "@quizarena/shared";
import { api, ensureCsrfToken } from "../api/client";

export const registerParticipant = async (payload: { name: string; email: string }) => {
  await ensureCsrfToken();
  const response = await api.post<AuthResponse>("/auth/register", payload);
  return response.data.user as AuthUser;
};

export const loginUser = async (payload: { email: string; password: string }) => {
  await ensureCsrfToken();
  const response = await api.post<AuthResponse>("/auth/login", payload);
  return response.data.user as AuthUser;
};
