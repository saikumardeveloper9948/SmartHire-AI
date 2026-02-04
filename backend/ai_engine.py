from typing import Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _preprocess_text(text: str) -> str:
    # Very lightweight preprocessing to avoid heavy NLP deps
    return " ".join(text.lower().split())


def analyze_resume(resume_text: str) -> str:
    # Placeholder: in real-world, you would extract skills, experience, etc.
    cleaned = _preprocess_text(resume_text)
    return cleaned


def compute_match_score(resume_text: str, job_description: str) -> Tuple[float, str]:
    resume_clean = _preprocess_text(resume_text)
    job_clean = _preprocess_text(job_description)

    corpus = [resume_clean, job_clean]
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)

    similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
    score = float(similarity_matrix[0][0])

    if score > 0.7:
        recommendation = "Strong match. Consider shortlisting this candidate."
    elif score > 0.4:
        recommendation = "Moderate match. Review manually for final decision."
    else:
        recommendation = "Low match. Candidate may not fit this role closely."

    return score, recommendation

