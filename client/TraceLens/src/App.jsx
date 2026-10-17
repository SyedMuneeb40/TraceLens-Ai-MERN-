import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import './App.css';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";
import ProjectOperations from "./pages/ProjectOperations";
import Admin from "./pages/Admin";
import UserSettings from "./pages/UserSettings";
import { ProtectedRoute, PublicRoute, RoleRoute } from "./components/auth/RouteGuards";
import { logout, setAuthentication } from "./store/authSlice";
import { refreshSessionApi } from "./services/loginService";
import "./pages/Auth.css";


function App() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.isLoading);

  useEffect(() => {
    let active = true;

    refreshSessionApi()
      .then((session) => {
        if (!active) return;

        if (session?.accessToken && session?.user) {
          dispatch(setAuthentication({
            user: session.user,
            accessToken: session.accessToken
          }));
        } else {
          dispatch(logout());
        }
      })
      .catch(() => {
        if (active) dispatch(logout());
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  if (isLoading) {
    return (
      <main className="auth-bootstrap-screen" aria-live="polite">
        <span className="auth-bootstrap-mark">TL</span>
        <span>Restoring your session...</span>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<Workspace />} />
          <Route path="/app/projects/:projectId" element={<ProjectOperations />} />
          <Route path="/app/settings" element={<UserSettings />} />

          <Route element={<RoleRoute role="admin" />}>
            <Route path="/admin/*" element={<Admin />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
