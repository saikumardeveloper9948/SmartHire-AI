import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="text-gray-600 dark:text-gray-300">
        Welcome to SmartHire AI. Use the AI module to analyze resumes and match them with job
        descriptions.
      </p>
      <Link
        to="/ai/match"
        className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
      >
        Go to AI Resume Matcher
      </Link>
    </div>
  );
};

export default Dashboard;

