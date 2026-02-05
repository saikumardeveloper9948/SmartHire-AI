import React, { useState } from "react";
import { Navigate, Route, Routes, Link } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";
import Alert from "./components/Alert";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ResumeMatch from "./pages/ResumeMatch";
import InterviewQuestions from "./pages/InterviewQuestions";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [alert, setAlert] = useState({ type: "success", message: "" });

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
              SmartHire AI
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="px-3 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="px-3 py-1 text-xs rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold">
                  AI-Powered Recruitment with Secure Email Verification
                </h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  SmartHire AI combines email OTP-based authentication with NLP-driven resume
                  analysis and job matching to help recruiters shortlist the best candidates.
                </p>
              </div>
            }
          />
          <Route path="/login" element={<Login showAlert={showAlert} />} />
          <Route path="/signup" element={<Signup showAlert={showAlert} />} />
          <Route path="/verify-otp" element={<VerifyOtp showAlert={showAlert} />} />
          <Route path="/forgot-password" element={<ForgotPassword showAlert={showAlert} />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai/match"
            element={
              <PrivateRoute>
                <ResumeMatch showAlert={showAlert} />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai/interview-questions"
            element={
              <PrivateRoute>
                <InterviewQuestions />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert((prev) => ({ ...prev, message: "" }))}
      />
    </div>
  );
};

export default App;

