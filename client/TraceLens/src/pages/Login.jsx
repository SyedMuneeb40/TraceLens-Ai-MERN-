import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Activity from "lucide-react/dist/esm/icons/activity";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";

import { loginUserApi } from "../services/loginService";
import { setAuthentication } from "../store/authSlice";
import "./Auth.css";

function getErrorMessage(error) {
  return (
    error?.apiMessage ||
    error?.response?.data?.message ||
    "Unable to sign in. Please check your credentials and try again."
  );
}

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const successMessage = location.state?.registrationMessage || "";

  const destination = location.state?.from?.pathname || "/app";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!credentials.email.trim() || !credentials.password) {
      setErrorMessage("Enter your email and password to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await loginUserApi({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      });

      if (!session?.accessToken || !session?.user) {
        throw new Error("The login response was incomplete.");
      }

      dispatch(
        setAuthentication({
          user: session.user,
          accessToken: session.accessToken
        })
      );
      navigate(destination, { replace: true });
    } catch (error) {
      setErrorMessage(error.message === "The login response was incomplete."
        ? "The server returned an incomplete login response."
        : getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <section className="auth-card" aria-labelledby="login-title">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark"><Activity size={21} /></span>
          <span>TraceLens <b>AI</b></span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">SECURE INVESTIGATION ACCESS</span>
          <h1 id="login-title">Welcome back.</h1>
          <p>Sign in to continue investigating incidents with your team.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {successMessage && (
            <div className="auth-success" role="status">
              <span className="auth-success-mark">✓</span>
              <span>{successMessage}. Please sign in to continue.</span>
            </div>
          )}

          {errorMessage && (
            <div className="auth-error" role="alert">
              <AlertCircle size={17} />
              <span>{errorMessage}</span>
            </div>
          )}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={credentials.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />

          <div className="auth-label-row">
            <label htmlFor="password">Password</label>
          </div>
          <div className="auth-password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="auth-spinner" size={18} /> : <ArrowRight size={18} />}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer-copy">
          New to TraceLens? <Link to="/register">Create an account</Link>
        </p>
        <p className="auth-footer-copy auth-footer-secondary">
          <Link to="/">Return to the landing page</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
