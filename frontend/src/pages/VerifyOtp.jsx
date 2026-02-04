import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";

const VerifyOtp = ({ showAlert }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      showAlert("success", "OTP verified successfully");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.detail || "OTP verification failed";
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await api.post("/auth/resend-otp", { email });
      showAlert("success", "OTP resent to your email");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to resend OTP";
      showAlert("error", msg);
    }
  };

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
            className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">OTP Code</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 tracking-widest text-center"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
      <button
        type="button"
        onClick={handleResend}
        className="mt-3 text-sm text-indigo-600 dark:text-indigo-400"
      >
        Resend OTP
      </button>
    </div>
  );
};

export default VerifyOtp;

