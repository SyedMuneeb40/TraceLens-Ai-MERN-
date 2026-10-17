import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export function ProtectedRoute() {
  const location = useLocation();
  const { accessToken, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const destination = location.state?.from?.pathname || "/app";

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

export function RoleRoute({ role }) {
  const userRole = useSelector((state) => state.auth.user?.role);

  if (userRole !== role) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
