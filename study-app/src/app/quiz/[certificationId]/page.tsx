'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Question } from '@/types';
import { safeJsonStorage } from '@/lib/storage-helper';

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string | string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accessStatus, setAccessStatus] = useState<any>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const params = useParams();
  const router = useRouter();
  const { certificationId } = params;

  // Check user access before loading quiz
  useEffect(() => {
    if (certificationId) {
      const checkAccess = async () => {
        try {
          const res = await fetch(`/api/user-access?certificationId=${certificationId}`);
          if (!res.ok) {
            if (res.status === 401) {
              router.push('/login');
              return;
            }
            throw new Error('Failed to check access');
          }
          const data = await res.json();
          setAccessStatus(data);
          
          if (!data.canTakeQuiz) {
            setError('You need to purchase access to this certification.');
            setLoading(false);
            setCheckingAccess(false);
            return;
          }
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
        } finally {
          setCheckingAccess(false);
        }
      };
      checkAccess();
    }
  }, [certificationId, router]);

  useEffect(() => {
    if (certificationId && accessStatus?.canTakeQuiz && !checkingAccess) {
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
          console.log('Quiz questions loaded:', data); // Debug
          setQuestions(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [certificationId, accessStatus, checkingAccess]);

  const handleOptionSelect = (questionId: string, optionId: string, isMultiSelect: boolean = false) => {
    console.log('handleOptionSelect:', { questionId, optionId, isMultiSelect }); // Debug
    if (isMultiSelect) {
      const currentAnswers = userAnswers[questionId] as string[] || [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId) // Remove if already selected
        : [...currentAnswers, optionId]; // Add if not selected
      console.log('Multi-select answers:', { currentAnswers, newAnswers }); // Debug
      setUserAnswers({ ...userAnswers, [questionId]: newAnswers });
    } else {
      setUserAnswers({ ...userAnswers, [questionId]: optionId });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
        const answersForApi = Object.entries(userAnswers).map(([questionId, selectedOption]) => ({
            questionId,
            selectedOptionId: Array.isArray(selectedOption) ? selectedOption : [selectedOption],
        }));

        const res = await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                certificationId: certificationId as string, 
                answers: answersForApi,
                isFreeAttempt: !accessStatus?.hasPaidAccess 
            }),
        });

        if (!res.ok) {
            throw new Error('Failed to submit results.');
        }
        const resultData = await res.json();

        // Use safe storage helper instead of direct localStorage
        safeJsonStorage.setItem('quizResults', resultData);
        router.push(`/quiz/results`);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setSubmitting(false);
    }
  };

  if (checkingAccess || loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
        <div className="text-xl font-semibold text-glow-purple">
          {checkingAccess ? 'Checking access...' : 'Loading Quiz...'}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center card-dark p-8 rounded-2xl max-w-md">
        <div className="text-xl font-semibold text-red-400 mb-4">
          {error}
        </div>
        {accessStatus?.needsPayment && (
          <div className="space-y-4">
            <p className="text-gray-300">
              You've used your free trial. Purchase access to continue taking quizzes for this certification.
            </p>
            <button
              onClick={() => router.push(`/certifications/${certificationId}/ratings`)}
              className="btn-neon-purple py-3 px-6 rounded-lg"
            >
              Purchase Access
            </button>
          </div>
        )}
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-gray-400 hover:text-white"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );

  const isQuizComplete = () => {
    return questions.every(question => {
      const answer = userAnswers[question.id];
      if (question.isMultiSelect) {
        return Array.isArray(answer) && answer.length > 0;
      } else {
        return typeof answer === 'string' && answer.length > 0;
      }
    });
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-glow-purple">Certification Quiz</h1>
        <div className="text-glow-orange">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>
      
      <div className="card-dark p-8 rounded-2xl mb-8">
        <div className="mb-6">
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <div 
              className="bg-gradient-to-r from-purple-500 to-orange-500 h-2 rounded-full transition-all duration-300" 
              style={{width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`}}
            ></div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-4 text-gray-100 leading-relaxed">
          {currentQuestion.questionText}
        </h2>
        
        {currentQuestion.isMultiSelect ? (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
            <div className="flex items-center text-yellow-300">
              <span className="text-2xl mr-3">☑️</span>
              <div>
                <div className="font-bold text-yellow-200">Multiple Choice Question</div>
                <div className="text-sm">Select ALL correct answers. You can choose more than one option.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
            <div className="flex items-center text-blue-300">
              <span className="text-2xl mr-3">🔘</span>
              <div>
                <div className="font-bold text-blue-200">Single Choice Question</div>
                <div className="text-sm">Select the ONE best answer.</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {currentQuestion.options.map(opt => {
            const isSelected = currentQuestion.isMultiSelect 
              ? (userAnswers[currentQuestion.id] as string[] || []).includes(opt.id)
              : userAnswers[currentQuestion.id] === opt.id;
              
            return (
              <div key={opt.id}>
                <label className="flex items-start p-4 sm:p-5 rounded-xl border-2 border-purple-500/20 cursor-pointer transition-all hover:border-purple-500/40 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-500/10 group">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type={currentQuestion.isMultiSelect ? "checkbox" : "radio"}
                      name={`question-${currentQuestion.id}`}
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(currentQuestion.id, opt.id, currentQuestion.isMultiSelect)}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 bg-transparent border-2 border-purple-500/50 focus:ring-purple-500 focus:ring-2 focus:ring-offset-0"
                    />
                  </div>
                  <span className="ml-3 sm:ml-4 text-base sm:text-lg text-gray-300 group-has-[:checked]:text-purple-300 group-hover:text-white transition-colors leading-relaxed">
                    {opt.optionText}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <button
            onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
            ← Previous
        </button>
        {currentQuestionIndex < questions.length - 1 ? (
            <button
                onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                className="btn-neon-purple font-bold py-3 px-8 rounded-xl"
            >
                Next →
            </button>
        ) : (
            <button
                onClick={handleSubmit}
                disabled={submitting || !isQuizComplete()}
                className="btn-neon-orange font-bold py-3 px-8 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
            >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="spinner-neon w-5 h-5 mr-3"></div>
                    Submitting...
                  </div>
                ) : (
                  'Finish & See Results ✨'
                )}
            </button>
        )}
      </div>
    </div>
  );
}
