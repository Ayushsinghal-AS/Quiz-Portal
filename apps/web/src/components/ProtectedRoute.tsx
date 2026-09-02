import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export const ProtectedRoute = ({ role }: { role?: "admin" | "participant" }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-arena-100">Checking session...</div>;
  }

  if (!user) {
    return <Navigate to={role === "admin" ? "/admin/login" : "/auth"} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }

  return <Outlet />;
};

