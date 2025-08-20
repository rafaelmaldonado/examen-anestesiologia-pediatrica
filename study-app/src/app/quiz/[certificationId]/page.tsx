'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Question } from '@/types';

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const params = useParams();
  const router = useRouter();
  const { certificationId } = params;

  useEffect(() => {
    if (certificationId) {
      const fetchQuestions = async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/quiz?certificationId=${certificationId}&count=10`);
          if (!res.ok) {
            throw new Error('Failed to fetch quiz questions.');
          }
          const data = await res.json();
          if (data.length === 0) {
            throw new Error("No questions found for this certification.");
          }
          setQuestions(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [certificationId]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setUserAnswers({ ...userAnswers, [questionId]: optionId });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
        const answersForApi = Object.entries(userAnswers).map(([questionId, selectedOptionId]) => ({
            questionId,
            selectedOptionId,
        }));

        const res = await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ certificationId: certificationId as string, answers: answersForApi }),
        });

        if (!res.ok) {
            throw new Error('Failed to submit results.');
        }
        const resultData = await res.json();

        localStorage.setItem('quizResults', JSON.stringify(resultData));
        router.push(`/quiz/results`);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="text-xl font-semibold">Loading Quiz...</div></div>;
  if (error) return <div className="flex justify-center items-center h-screen"><div className="text-xl font-semibold text-red-500">Error: {error}</div></div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Quiz in Progress</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-right text-sm text-gray-500 mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
        <h2 className="text-2xl font-semibold mb-6">{currentQuestion.questionText}</h2>
        <div className="space-y-3">
          {currentQuestion.options.map(opt => (
            <div key={opt.id}>
              <label className="flex items-center p-4 rounded-lg border-2 border-gray-200 cursor-pointer transition-all has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={opt.id}
                  checked={userAnswers[currentQuestion.id] === opt.id}
                  onChange={() => handleOptionSelect(currentQuestion.id, opt.id)}
                  className="w-4 h-4"
                />
                <span className="ml-4 text-lg text-black">{opt.optionText}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center mt-8">
        <button
            onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Previous
        </button>
        {currentQuestionIndex < questions.length - 1 ? (
            <button
                onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
                Next
            </button>
        ) : (
            <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(userAnswers).length !== questions.length}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Submitting...' : 'Finish & See Results'}
            </button>
        )}
      </div>
    </div>
  );
}
