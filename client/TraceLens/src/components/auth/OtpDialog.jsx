import { useEffect, useState } from "react";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle";
import MailCheck from "lucide-react/dist/esm/icons/mail-check";
import X from "lucide-react/dist/esm/icons/x";

function OtpDialog({ email, title, description, onClose, onVerify, onResend }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !isVerifying && !isResending) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isVerifying, isResending, onClose]);

  const verify = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setIsVerifying(true);
    try {
      await onVerify(otp);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to verify this code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resend = async () => {
    setError("");
    setIsResending(true);
    try {
      await onResend();
      setOtp("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to resend the code.");
    } finally {
      setIsResending(false);
    }
  };

  return <div className="otp-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !isVerifying && !isResending && onClose()}><section className="otp-dialog" role="dialog" aria-modal="true" aria-labelledby="otp-dialog-title"><button className="otp-dialog-close" type="button" onClick={onClose} disabled={isVerifying || isResending} aria-label="Close verification dialog"><X size={18} /></button><span className="otp-dialog-icon"><MailCheck size={22} /></span><span className="auth-eyebrow">EMAIL VERIFICATION</span><h2 id="otp-dialog-title">{title}</h2><p>{description} We sent a six-digit code to <strong>{email}</strong>. It expires in five minutes.</p><form onSubmit={verify}><label htmlFor="verification-code">Verification code</label><input id="verification-code" className="otp-dialog-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" aria-describedby={error ? "otp-error" : undefined} required />{error && <div className="otp-dialog-error" id="otp-error" role="alert">{error}</div>}<button className="dashboard-button dashboard-button-primary otp-dialog-submit" type="submit" disabled={isVerifying || isResending}>{isVerifying && <LoaderCircle className="auth-spinner" size={16} />}{isVerifying ? "Verifying..." : "Verify code"}</button></form><button className="otp-dialog-resend" type="button" onClick={resend} disabled={isVerifying || isResending}>{isResending && <LoaderCircle className="auth-spinner" size={14} />}{isResending ? "Sending new code..." : "Resend verification code"}</button></section></div>;
}

export default OtpDialog;
