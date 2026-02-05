import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import PasswordInput from "../components/PasswordInput";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const getRemainingSeconds = (expiresAtIso) => {
  if (!expiresAtIso) return 0;
  const expires = new Date(expiresAtIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((expires - now) / 1000));
};

const ForgotPassword = ({ showAlert }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemainingSeconds(getRemainingSeconds(expiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showAlert("error", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
      setResetToken(data.reset_token);
      setExpiresAt(data.expires_at);
      setRemainingSeconds(getRemainingSeconds(data.expires_at));
      setStep(2);
      showAlert("success", "OTP sent to your email.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to send OTP.";
      showAlert("error", msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!resetToken || !email) return;
    setResendLoading(true);
    try {
      const { data } = await api.post("/auth/resend-forgot-otp", {
        reset_token: resetToken,
        email,
      });
      setExpiresAt(data.expires_at);
      setRemainingSeconds(getRemainingSeconds(data.expires_at));
      showAlert("success", "OTP resent.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to resend OTP.";
      showAlert("error", msg);
    } finally {
      setResendLoading(false);
    }
  }, [resetToken, email, showAlert]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      showAlert("error", "Please enter the OTP sent to your email.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-forgot-otp", {
        reset_token: resetToken,
        email,
        otp,
      });
      showAlert("success", "OTP verified successfully.");
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to verify OTP.";
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showAlert("error", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        reset_token: resetToken,
        email,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      showAlert("success", "Password updated successfully.");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to reset password.";
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const canResend = resetToken && remainingSeconds <= 0;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>

      {step === 1 && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Enter your email address and we will send you an OTP to reset your password.
          </p>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">OTP Code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              maxLength={6}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 tracking-widest text-center"
            />
          </div>
          {expiresAt && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <span>OTP valid for </span>
              <span
                className={`font-mono font-medium ${remainingSeconds <= 0 ? "text-red-600 dark:text-red-400" : ""}`}
              >
                {formatTime(remainingSeconds)}
              </span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || resendLoading}
              className={`text-sm ${
                canResend && !resendLoading
                  ? "text-indigo-600 dark:text-indigo-400 hover:underline"
                  : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }`}
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
            {!canResend && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Resend available when timer reaches 00:00
              </span>
            )}
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">New Password</label>
            <PasswordInput
              name="new_password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <PasswordInput
              name="confirm_password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      )}

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
