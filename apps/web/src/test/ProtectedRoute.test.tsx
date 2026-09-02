import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AuthUser } from "@quizarena/shared";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { vi } from "vitest";

const useAuthMock = vi.fn();

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const renderWithRouter = (user: AuthUser | null, role: "admin" | "participant", loading = false) => {
  useAuthMock.mockReturnValue({ user, loading });
  render(
    <MemoryRouter
      initialEntries={["/admin"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route element={<ProtectedRoute role={role} />}>
          <Route path="/admin" element={<div>Protected content</div>} />
        </Route>
        <Route path="/admin/login" element={<div>Admin login</div>} />
        <Route path="/auth" element={<div>Participant auth</div>} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("ProtectedRoute", () => {
  it("redirects unauthenticated admins to admin login", () => {
    renderWithRouter(null, "admin");
    expect(screen.getByText("Admin login")).toBeInTheDocument();
  });

  it("renders protected content for matching roles", () => {
    renderWithRouter(
      { id: "1", name: "Admin", email: "admin@test.dev", role: "admin" },
      "admin",
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
