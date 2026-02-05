import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import PasswordInput from "../components/PasswordInput";

const Signup = ({ showAlert }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      showAlert("success", "OTP has been sent to your email address. Please check your inbox.");
      navigate("/verify-otp", {
        state: { email: form.email, signupToken: data.signup_token, expiresAt: data.expires_at },
      });
    } catch (err) {
      const msg = err.response?.data?.detail || "Signup failed";
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create an account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <PasswordInput
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        Already have an account?{" "}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400">
          Login
        </Link>
      </p>
    </div>
  );
};

export default Signup;

