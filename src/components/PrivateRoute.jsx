import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
}