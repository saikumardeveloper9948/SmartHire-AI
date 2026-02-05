import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const Gauge = ({ value }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="mx-auto">
      <circle
        cx="80"
        cy="80"
        r={radius}
        stroke="#4b5563"
        strokeWidth="10"
        fill="transparent"
        className="opacity-30"
      />
      <circle
        cx="80"
        cy="80"
        r={radius}
        stroke="#4f46e5"
        strokeWidth="10"
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
      />
      <text
        x="80"
        y="78"
        textAnchor="middle"
        className="fill-gray-100 text-2xl font-semibold"
      >
        {clamped.toFixed(0)}%
      </text>
      <text
        x="80"
        y="100"
        textAnchor="middle"
        className="fill-gray-400 text-xs"
      >
        Profile Match
      </text>
    </svg>
  );
};

const ResumeMatch = ({ showAlert }) => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    setFile(selected); // replaces any previous file
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showAlert("error", "Please upload a resume file (PDF or DOCX).");
      return;
    }
    if (!jobDescription.trim()) {
      showAlert("error", "Please enter a job description.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", jobDescription);

      const res = await api.post("/ai/match-job-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      showAlert("success", "Match score generated.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to generate match score.";
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const scorePct = result ? result.score * 100 : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">AI Resume & Job Matching</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Upload a candidate resume (PDF or DOCX) and provide the job description. SmartHire AI
        will compute a match score and highlight missing keywords.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col space-y-3">
          <label className="text-sm font-medium">Resume File (PDF / DOCX)</label>
          <label className="flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed rounded-md cursor-pointer bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:border-indigo-500">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {file ? (
                <>
                  Selected file:{" "}
                  <span className="font-semibold break-all">{file.name}</span>
                </>
              ) : (
                "Click to select a resume file"
              )}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {file && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Selecting a new file will replace the previously uploaded resume.
            </p>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Job Description</label>
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
        <div className="mt-4 p-4 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 grid gap-6 md:grid-cols-2 items-center">
          <div className="flex flex-col items-center">
            <Gauge value={scorePct} />
            {result.recommendation && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 text-center">
                {result.recommendation}
              </p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                Keywords matched in resume
              </h3>
              {result.matched_keywords && result.matched_keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.matched_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No strong keyword matches detected yet.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                Keywords not found in resume
              </h3>
              {result.missing_keywords && result.missing_keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-1 text-xs rounded-full bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200 border border-red-200 dark:border-red-700"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No obvious missing keywords detected from the job description.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              if (!result.resume_text) {
                showAlert("error", "Resume text not available. Please re-upload or use the Analyze Resume endpoint.");
                return;
              }
              navigate("/ai/interview-questions", {
                state: { resume_text: result.resume_text, job_description: jobDescription },
              });
            }}
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            Generate Interview Questions
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeMatch;

