import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Activity from "lucide-react/dist/esm/icons/activity";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";

import { registerUserApi, verifyRegistrationOtpApi } from "../services/loginService";
import OtpDialog from "../components/auth/OtpDialog";
import "./Auth.css";

function getErrorMessage(error) {
  return (
    error?.apiMessage ||
    error?.response?.data?.message ||
    "Unable to create your account. Please try again."
  );
}

function Register() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOtpOpen, setIsOtpOpen] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const username = credentials.username.trim();
    const email = credentials.email.trim().toLowerCase();

    if (!username || !email || !credentials.password || !credentials.confirmPassword) {
      setErrorMessage("Complete all fields to create your account.");
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUserApi({
        username,
        email,
        password: credentials.password
      });

      if (!result?.success) {
        throw new Error(result?.message || "Registration was not completed.");
      }

      setIsOtpOpen(true);
    } catch (error) {
      setErrorMessage(
        error.message === "Registration was not completed."
          ? "The server could not complete registration."
          : getErrorMessage(error)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyRegistration = async (otp) => {
    const result = await verifyRegistrationOtpApi({
      username: credentials.username.trim(),
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      otp
    });
    if (!result?.success) throw new Error(result?.message || "Registration was not completed.");
    setIsOtpOpen(false);
    navigate("/login", {
      replace: true,
      state: { registrationMessage: result.message || "User Successfully Registered" }
    });
  };

  const resendRegistrationOtp = async () => {
    const result = await registerUserApi({
      username: credentials.username.trim(),
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password
    });
    if (!result?.success) throw new Error(result?.message || "Unable to resend verification code.");
  };

  return (
    <main className="auth-page register-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="register-orbit register-orbit-one" aria-hidden="true" />
      <div className="register-orbit register-orbit-two" aria-hidden="true" />

      <section className="auth-card register-card" aria-labelledby="register-title">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark"><Activity size={21} /></span>
          <span>TraceLens <b>AI</b></span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">BUILD YOUR INVESTIGATION SPACE</span>
          <h1 id="register-title">Create your signal.</h1>
          <p>Set up your secure identity and start seeing the story inside every incident.</p>
        </div>

        <div className="register-signal" aria-hidden="true">
          <span className="register-signal-dot" />
          <span className="register-signal-copy">New workspace identity</span>
          <span className="register-signal-status">READY</span>
        </div>

        <form className="auth-form register-form" onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <div className="auth-error" role="alert">
              <AlertCircle size={17} />
              <span>{errorMessage}</span>
            </div>
          )}

          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={credentials.username}
            onChange={handleChange}
            placeholder="Choose a workspace name"
            required
          />

          <label className="register-spaced-label" htmlFor="email">Email address</label>
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

          <label className="register-spaced-label" htmlFor="password">Password</label>
          <div className="auth-password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Create a password"
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

          <label className="register-spaced-label" htmlFor="confirmPassword">Confirm password</label>
          <div className="auth-password-field">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={credentials.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="auth-spinner" size={18} /> : <ArrowRight size={18} />}
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer-copy">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-footer-copy auth-footer-secondary">
          <Link to="/">Return to the landing page</Link>
        </p>
      </section>
      {isOtpOpen && <OtpDialog
        email={credentials.email.trim().toLowerCase()}
        title="Verify your email"
        description="Confirm your email to finish creating your account."
        onClose={() => setIsOtpOpen(false)}
        onVerify={verifyRegistration}
        onResend={resendRegistrationOtp}
      />}
    </main>
  );
}

export default Register;
