import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";

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

const VerifyOtp = ({ showAlert }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const signupToken = location.state?.signupToken;
  const [expiresAt, setExpiresAt] = useState(location.state?.expiresAt || null);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(location.state?.expiresAt)
  );

  // Countdown timer - update every second from expiresAt (UTC)
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemainingSeconds(getRemainingSeconds(expiresAt));
    tick(); // initial
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!signupToken) {
      showAlert("error", "Session expired. Please complete signup again.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { signup_token: signupToken, email, otp });
      showAlert("success", "Your email has been verified successfully. You may now sign in.");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.detail || "Verification failed. Please try again.";
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!signupToken || !email) {
      showAlert("error", "Session expired. Please complete signup again.");
      return;
    }
    setResendLoading(true);
    try {
      const { data } = await api.post("/auth/resend-otp", { signup_token: signupToken, email });
      setExpiresAt(data.expires_at);
      setRemainingSeconds(getRemainingSeconds(data.expires_at));
      showAlert("success", "OTP resent.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to resend OTP. Please try again.";
      showAlert("error", msg);
    } finally {
      setResendLoading(false);
    }
  }, [signupToken, email, showAlert]);

  const canResend = signupToken && remainingSeconds <= 0;
  const displayTime = expiresAt ? formatTime(remainingSeconds) : "--:--";

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Verify your email</h2>
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter the email used for signup"
            className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
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
            <span className={`font-mono font-medium ${remainingSeconds <= 0 ? "text-red-600 dark:text-red-400" : ""}`}>
              {displayTime}
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
      </form>
      <div className="mt-3 flex flex-col items-center gap-2">
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
    </div>
  );
};

export default VerifyOtp;
