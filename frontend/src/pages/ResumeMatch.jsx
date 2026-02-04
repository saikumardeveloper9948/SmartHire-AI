import React, { useState } from "react";
import api from "../api/client";

const ResumeMatch = ({ showAlert }) => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/ai/match-job", {
        resume_text: resumeText,
        job_description: jobDescription,
      });
      setResult(res.data);
      showAlert("success", "Match score generated");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to generate match score";
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">AI Resume & Job Matching</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-sm mb-1">Resume Text</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="flex-1 min-h-[180px] px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            placeholder="Paste candidate resume text here..."
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="flex-1 min-h-[180px] px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            placeholder="Paste job description here..."
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Generate Match Score"}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-4 p-4 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Match Score:{" "}
            <span className="font-semibold">
              {(result.score * 100).toFixed(2)}%
            </span>
          </p>
          {result.recommendation && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Recommendation: {result.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeMatch;

