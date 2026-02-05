import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

const Login = ({ showAlert }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.access_token);
      showAlert("success", "Login successful");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed";
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          />
        </div>
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        New here?{" "}
        <Link to="/signup" className="text-indigo-600 dark:text-indigo-400">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default Login;

