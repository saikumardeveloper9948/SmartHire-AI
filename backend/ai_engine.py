from typing import List, Tuple, Optional, Set


import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _preprocess_text(text: str) -> str:
    # Very lightweight preprocessing to avoid heavy NLP deps
    return " ".join(text.lower().split())


def _tokenize(text: str) -> Set[str]:
    # Basic word tokenizer for keyword comparison
    return set(re.findall(r"[a-zA-Z]{3,}", text.lower()))


_STOPWORDS = {
    "and",
    "the",
    "for",
    "with",
    "this",
    "that",
    "from",
    "have",
    "will",
    "your",
    "you",
    "our",
    "are",
    "job",
    "role",
    "work",
    "team",
}


def analyze_resume(resume_text: str) -> str:
    # Placeholder: in real-world, you would extract skills, experience, etc.
    cleaned = _preprocess_text(resume_text)
    return cleaned


def compute_match_score(resume_text: str, job_description: str) -> Tuple[float, str, List[str], List[str]]:
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

    # Compute simple missing keywords: words present in job description but not in resume
    resume_words = _tokenize(resume_text)
    job_words = _tokenize(job_description)

    missing = [
        w
        for w in sorted(job_words - resume_words)
        if w not in _STOPWORDS and len(w) > 2
    ][:50]

    matched = [
        w
        for w in sorted(job_words & resume_words)
        if w not in _STOPWORDS and len(w) > 2
    ][:50]

    return score, recommendation, missing, matched


def generate_interview_questions(resume_text: str, job_description: str, experience_level: Optional[str] = None, questions_per_category: int = 3) -> dict:
    """
    Generate interview questions and short model answers using OpenAI.

    Returns a dict with the structure:
    {
      "candidate_experience_level": "mid",
      "categories": [
        {"category": "Technical depth", "questions": [{"question":"...","answer":"..."}, ...]},
        {"category": "Problem-solving", "questions": [...]},
        {"category": "Communication skills", "questions": [...]}
      ],
      "model_used": "gpt-3.5-turbo"
    }
    """
    import logging
    import os
    import json
    logger = logging.getLogger(__name__)
    
    from config import settings
    try:
        from openai import OpenAI
    except Exception as e:
        logger.error(f"Failed to import OpenAI: {str(e)}")
        raise ValueError("Missing `openai` package. Install with `pip install openai`.") from e

    if not (settings.OPENAI_API_KEY):
        logger.error("OpenAI API key not configured")
        raise ValueError("OpenAI API key not configured. Set OPENAI_API_KEY in environment.")

    logger.info("Initializing OpenAI client")
    try:
        # Set API key as environment variable for OpenAI client
        os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
        client = OpenAI()
    except TypeError as e:
        logger.error(f"TypeError initializing OpenAI client: {str(e)}")
        # Fallback: try with explicit api_key parameter
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
        except Exception as e2:
            logger.error(f"Failed to initialize OpenAI client: {str(e2)}")
            raise ValueError(f"Failed to initialize OpenAI client: {str(e2)}") from e2
    
    model = settings.OPENAI_MODEL or "gpt-3.5-turbo"

    exp = experience_level or "mid"

    prompt = (
        "You are an assistant that creates concise interview questions with short model answers. "
        "Input: a resume summary and a job description. Output MUST be valid JSON **only** with the following structure:\n\n"
        '{ "candidate_experience_level": "<junior|mid|senior>",\n'
        '  "categories": [\n'
        '    {"category": "Technical depth", "questions": [{"question":"...","answer":"..."}]},\n'
        '    {"category": "Problem-solving", "questions": [{"question":"...","answer":"..."}]},\n'
        '    {"category": "Communication skills", "questions": [{"question":"...","answer":"..."}] }\n'
        '  ]\n'
        '}\n\n'
        f"Use the candidate_experience_level: {exp}. Provide {questions_per_category} questions per category. "
        "Make questions relevant to the resume and job description, and keep answers concise (1-3 sentences). "
        "Do not include any extra commentary or text outside the JSON."
        "\n\nResume summary:\n" + resume_text + "\n\nJob description:\n" + job_description
    )

    try:
        logger.info(f"Calling OpenAI API with model: {model}")
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs valid JSON, and nothing else."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=800,
        )
        logger.info("OpenAI API call successful")
        
        content = resp.choices[0].message.content
        logger.info(f"Raw response content: {content[:200]}...")
        
        parsed = json.loads(content)
        logger.info(f"Successfully parsed JSON response")
        
        # Basic validation of structure
        if "categories" not in parsed:
            logger.error("OpenAI response did not include 'categories'")
            raise ValueError("OpenAI response did not include 'categories'.")
        
        parsed["model_used"] = model
        logger.info("Response validated and formatted")
        return parsed
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from OpenAI response: {str(e)}")
        raise ValueError("Failed to parse JSON from OpenAI response.") from e
    except Exception as e:
        logger.error(f"OpenAI API error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise ValueError("OpenAI API error: " + str(e)) from e

