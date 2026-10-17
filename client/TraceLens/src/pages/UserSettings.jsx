import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Activity from "lucide-react/dist/esm/icons/activity";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import KeyRound from "lucide-react/dist/esm/icons/key-round";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import UserRound from "lucide-react/dist/esm/icons/user-round";

import { logoutUserFromAllSessionApi } from "../services/loginService";
import { changeCurrentPasswordApi, getCurrentUserApi, requestPasswordOtpApi, updateCurrentUserApi } from "../services/userService";
import { logout, setAccessToken, setUser } from "../store/authSlice";
import OtpDialog from "../components/auth/OtpDialog";
import "./Auth.css";

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

function PasswordField({ id, label, value, onChange, visible, onToggle, placeholder }) {
  return (
    <div className="settings-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-field"><input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="new-password" required /><button className="password-toggle" type="button" onClick={onToggle} aria-label={visible ? `Hide ${label}` : `Show ${label}`}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
    </div>
  );
}

function UserSettings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [profile, setProfile] = useState({ username: user?.username || "", email: user?.email || "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      getCurrentUserApi()
        .then((response) => setProfile({ username: response.user?.username || "", email: response.user?.email || "" }))
        .catch((requestError) => setError(errorMessage(requestError, "Unable to load your account.")))
        .finally(() => setIsLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingProfile(true);
    try {
      const response = await updateCurrentUserApi(profile);
      dispatch(setUser(response.user));
      if (response.accessToken) dispatch(setAccessToken(response.accessToken));
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to update your profile."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.newPassword !== password.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await requestPasswordOtpApi({ currentPassword: password.currentPassword });
      setIsOtpOpen(true);
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to change your password."));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const verifyPasswordOtp = async (otp) => {
    await changeCurrentPasswordApi({ otp, newPassword: password.newPassword });
    setIsOtpOpen(false);
    dispatch(logout());
    navigate("/login", { replace: true, state: { message: "Password changed. Please login again." } });
  };

  const resendPasswordOtp = async () => {
    await requestPasswordOtpApi({ currentPassword: password.currentPassword });
  };

  const handleLogoutAll = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUserFromAllSessionApi();
    } finally {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  if (isLoading) return <main className="settings-page workspace-page settings-loading"><LoaderCircle className="auth-spinner" size={27} /><span>Loading account settings...</span></main>;

  return (
    <main className="settings-page workspace-page">
      <header className="dashboard-topbar settings-header"><Link to="/app" className="auth-brand"><span className="auth-brand-mark"><Activity size={20} /></span><span>TraceLens <b>AI</b></span></Link><div className="settings-header-actions"><span className="dashboard-user-chip"><span className="dashboard-avatar">{(user?.username || "U").slice(0, 1).toUpperCase()}</span>{user?.username || "User"}</span><Link to="/app" className="dashboard-button dashboard-button-quiet"><ArrowLeft size={16} /> Dashboard</Link></div></header>
      <section className="settings-content">
        <div className="settings-heading"><span className="auth-eyebrow">ACCOUNT CONTROL CENTER</span><h1>Your settings</h1><p>Keep your profile current and protect your TraceLens workspace.</p></div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        {message && <div className="auth-success" role="status"><CheckCircle2 size={17} />{message}</div>}
        <div className="settings-grid">
          <section className="settings-card"><div className="settings-card-heading"><span className="settings-card-icon"><UserRound size={19} /></span><div><span className="auth-eyebrow">PROFILE</span><h2>Personal details</h2></div></div><form className="settings-form" onSubmit={handleProfileSubmit}><label htmlFor="settings-username">Username</label><input id="settings-username" value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value })} autoComplete="username" required /><label htmlFor="settings-email">Email</label><input id="settings-email" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} autoComplete="email" required /><div className="settings-account-meta"><span><ShieldCheck size={14} /> Role: {user?.role || "user"}</span><span>Username and email are unique</span></div><button className="dashboard-button dashboard-button-primary" type="submit" disabled={isSavingProfile}>{isSavingProfile && <LoaderCircle className="auth-spinner" size={16} />}{isSavingProfile ? "Saving..." : "Save profile"}</button></form></section>
          <section className="settings-card"><div className="settings-card-heading"><span className="settings-card-icon"><KeyRound size={19} /></span><div><span className="auth-eyebrow">SECURITY</span><h2>Change password</h2></div></div><form className="settings-form" onSubmit={handlePasswordSubmit}><PasswordField id="current-password" label="Current password" value={password.currentPassword} onChange={(value) => setPassword({ ...password, currentPassword: value })} visible={showPassword.current} onToggle={() => setShowPassword({ ...showPassword, current: !showPassword.current })} placeholder="Enter current password" /><PasswordField id="new-password" label="New password" value={password.newPassword} onChange={(value) => setPassword({ ...password, newPassword: value })} visible={showPassword.next} onToggle={() => setShowPassword({ ...showPassword, next: !showPassword.next })} placeholder="At least 6 characters" /><PasswordField id="confirm-password" label="Confirm new password" value={password.confirmPassword} onChange={(value) => setPassword({ ...password, confirmPassword: value })} visible={showPassword.confirm} onToggle={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} placeholder="Repeat new password" /><div className="settings-security-note"><KeyRound size={14} /><span>Changing your password signs out all active sessions.</span></div><button className="dashboard-button dashboard-button-primary" type="submit" disabled={isSavingPassword}>{isSavingPassword && <LoaderCircle className="auth-spinner" size={16} />}{isSavingPassword ? "Updating..." : "Change password"}</button></form></section>
        </div>
        <section className="settings-card settings-sessions-card"><div className="settings-card-heading"><span className="settings-card-icon"><LogOut size={19} /></span><div><span className="auth-eyebrow">SESSIONS</span><h2>Sign out everywhere</h2><p>Use this if you think another device may still have access.</p></div></div><button className="dashboard-button dashboard-button-quiet" type="button" onClick={handleLogoutAll} disabled={isLoggingOut}>{isLoggingOut && <LoaderCircle className="auth-spinner" size={16} />}{isLoggingOut ? "Signing out..." : "Logout all sessions"}</button></section>
      </section>
      {isOtpOpen && <OtpDialog
        email={user?.email || profile.email}
        title="Confirm password change"
        description="Enter the verification code to securely update your password."
        onClose={() => setIsOtpOpen(false)}
        onVerify={verifyPasswordOtp}
        onResend={resendPasswordOtp}
      />}
    </main>
  );
}

export default UserSettings;
