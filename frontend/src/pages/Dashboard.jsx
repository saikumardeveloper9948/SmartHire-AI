import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Welcome to SmartHire AI. Upload resumes, compare them with job descriptions, and let our
          AI highlight the best-matched profiles in seconds.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-100">
            1. Upload Resume
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Add a candidate&apos;s resume as a PDF or DOCX file. SmartHire AI will automatically
            read and clean the content.
          </p>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-100">
            2. Paste Job Description
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Provide the role&apos;s responsibilities and requirements to generate a precise match
            score.
          </p>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-100">
            3. Review Match Insights
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            See a profile match percentage and missing keywords so you can quickly decide who to
            shortlist.
          </p>
        </div>
      </div>

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

