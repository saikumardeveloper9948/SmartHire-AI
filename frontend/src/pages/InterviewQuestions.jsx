import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";

const InterviewQuestions = ({}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resume_text, job_description } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!resume_text || !job_description) {
      // If required data isn't present, navigate back
      navigate("/ai/match");
      return;
    }
    const fetchQuestions = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.post("/ai/interview-questions", {
          resume_text,
          job_description,
          // optional: you could send experience_level if known
        });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to generate questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [resume_text, job_description, navigate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Interview Questions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 rounded-md border border-gray-300"
          >
            Back
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const res = await api.post("/ai/interview-questions", {
                  resume_text,
                  job_description,
                });
                setData(res.data);
              } catch (err) {
                setError(err.response?.data?.detail || "Failed to generate questions.");
              } finally {
                setLoading(false);
              }
            }}
            className="px-3 py-1 rounded-md bg-indigo-600 text-white"
          >
            Reload Questions
          </button>
        </div>
      </div>

      {loading && <p>Generating questions...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Experience: {data.candidate_experience_level}</p>
          {data.categories.map((cat) => (
            <div key={cat.category} className="p-4 rounded-md border bg-white dark:bg-gray-800">
              <h3 className="font-semibold mb-2">{cat.category}</h3>
              <ol className="list-decimal ml-5 space-y-2">
                {cat.questions.map((q, idx) => (
                  <li key={idx} className="space-y-1">
                    <div className="font-medium">{q.question}</div>
                    <div className="text-sm text-gray-600">Answer: {q.answer}</div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewQuestions;
