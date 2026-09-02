import type { AuthResponse, CsrfTokenResponse } from "@quizarena/shared";
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    // Skips ngrok's browser-warning interstitial page, which otherwise
    // returns an HTML page instead of the API response for any visitor
    // who hasn't manually clicked through it in that exact browser.
    // Harmless when the API isn't behind ngrok.
    "ngrok-skip-browser-warning": "true",
  },
});

let csrfToken: string | null = null;

export const setCsrfToken = (nextToken: string | null) => {
  csrfToken = nextToken;
};

export const ensureCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await api.get<CsrfTokenResponse>("/auth/csrf-token");
  csrfToken = response.data.csrfToken;
  return csrfToken;
};

api.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();
  const isMutation = method && !["GET", "HEAD", "OPTIONS"].includes(method);
  const isCsrfRequest = config.url?.includes("/auth/csrf-token");

  if (isMutation && !isCsrfRequest) {
    const token = await ensureCsrfToken();
    config.headers = axios.AxiosHeaders.from(config.headers);
    config.headers.set("x-csrf-token", token);
  }

  return config;
});

api.interceptors.response.use((response) => {
  const maybeAuthResponse = response.data as Partial<AuthResponse> | undefined;
  if (maybeAuthResponse?.csrfToken) {
    csrfToken = maybeAuthResponse.csrfToken;
  }
  return response;
});

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
};
