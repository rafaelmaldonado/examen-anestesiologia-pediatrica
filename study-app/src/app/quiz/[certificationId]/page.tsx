'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Question } from '@/types';
import { safeJsonStorage } from '@/lib/storage-helper';
import Link from 'next/link';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string | string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const examDurationSecondsRef = useRef(30 * 60);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const params = useParams();
  const router = useRouter();
  const { certificationId } = params;

  useEffect(() => {
    if (!certificationId) return;

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/quiz?certificationId=${certificationId}&count=20`);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorCode(res.status);
          setError(data.error || 'Error al cargar el examen.');
          return;
        }

        const data = await res.json();
        const durationSeconds = (data.examDurationMinutes ?? 30) * 60;
        examDurationSecondsRef.current = durationSeconds;
        setTimeLeft(durationSeconds);

        if (!data.questions?.length) {
          setError('No se encontraron preguntas para esta materia.');
          return;
        }
        setQuestions(data.questions);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [certificationId]);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : examDurationSecondsRef.current;

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
          timeTaken,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudieron enviar los resultados.');
      }
      const resultData = await res.json();
      safeJsonStorage.setItem('quizResults', resultData);
      router.push('/quiz/results');
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }, [submitting, userAnswers, certificationId, router]);

  // Start timer when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !examStarted) {
      setExamStarted(true);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [questions, examStarted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && examStarted && !submitting) {
      handleSubmit(true);
    }
  }, [timeLeft, examStarted, submitting, handleSubmit]);

  const handleOptionSelect = (questionId: string, optionId: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      const currentAnswers = userAnswers[questionId] as string[] || [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      setUserAnswers({ ...userAnswers, [questionId]: newAnswers });
    } else {
      setUserAnswers({ ...userAnswers, [questionId]: optionId });
    }
  };

  const isExamComplete = () => questions.every(question => {
    const answer = userAnswers[question.id];
    if (question.isMultiSelect) return Array.isArray(answer) && answer.length > 0;
    return typeof answer === 'string' && answer.length > 0;
  });

  const answeredCount = questions.filter(q => {
    const answer = userAnswers[q.id];
    if (q.isMultiSelect) return Array.isArray(answer) && answer.length > 0;
    return typeof answer === 'string' && answer.length > 0;
  }).length;

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
        <div className="text-lg font-medium text-[var(--foreground-muted)]">Cargando examen...</div>
      </div>
    </div>
  );

  if (error) {
    // Exam already taken (409)
    if (errorCode === 409) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center card-dark p-10 rounded-2xl max-w-md">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Examen ya completado</h2>
            <p className="text-[var(--foreground-muted)] mb-6">{error}</p>
            <Link href="/history" className="btn-neon-purple py-3 px-8 rounded-lg inline-block">
              Ver mi historial
            </Link>
          </div>
        </div>
      );
    }

    // Exam inactive (403)
    if (errorCode === 403) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center card-dark p-10 rounded-2xl max-w-md">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Examen no disponible</h2>
            <p className="text-[var(--foreground-muted)] mb-6">{error}</p>
            <Link href="/" className="btn-neon-purple py-3 px-8 rounded-lg inline-block">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center card-dark p-8 rounded-2xl max-w-md">
          <div className="text-lg font-semibold text-[var(--error)] mb-4">{error}</div>
          <button onClick={() => router.push('/')} className="mt-4 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isTimeLow = timeLeft > 0 && timeLeft <= 300;

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-3xl min-h-screen">
      {/* Header with timer */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Examen</h1>
          <div className="text-sm text-[var(--foreground-muted)] mt-1">
            Respondidas: {answeredCount} / {questions.length}
          </div>
        </div>
        <div className={`text-center px-5 py-3 rounded-xl font-mono text-2xl font-bold border-2 ${
          isTimeLow
            ? 'text-red-600 border-red-300 bg-red-50 animate-pulse'
            : 'text-[var(--foreground)] border-[var(--border)] bg-[var(--background-secondary)]'
        }`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {isTimeLow && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium text-center">
          ⚠️ ¡Quedan menos de 5 minutos! El examen se enviará automáticamente al terminar el tiempo.
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-[var(--background-tertiary)] rounded-full h-2 mb-6">
        <div
          className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="text-[var(--accent)] font-medium text-sm mb-4 text-center">
        Pregunta {currentQuestionIndex + 1} de {questions.length}
      </div>

      <div className="card-dark p-6 sm:p-8 rounded-xl mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[var(--foreground)] leading-relaxed">
          {currentQuestion.questionText}
        </h2>

        {currentQuestion.isMultiSelect ? (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center text-amber-800">
              <span className="text-xl mr-3">☑️</span>
              <div>
                <div className="font-semibold text-amber-900">Selección múltiple</div>
                <div className="text-sm text-amber-700">Selecciona TODAS las respuestas correctas.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-800">
              <span className="text-xl mr-3">🔘</span>
              <div>
                <div className="font-semibold text-blue-900">Selección única</div>
                <div className="text-sm text-blue-700">Selecciona la MEJOR respuesta.</div>
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
                <label className="flex items-start p-4 sm:p-5 rounded-xl border-2 border-[var(--border)] cursor-pointer transition-all hover:border-[var(--primary)] hover:bg-[var(--primary-lighter)] has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-lighter)] group">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type={currentQuestion.isMultiSelect ? 'checkbox' : 'radio'}
                      name={`question-${currentQuestion.id}`}
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(currentQuestion.id, opt.id, currentQuestion.isMultiSelect)}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)] bg-transparent border-2 border-[var(--border-hover)] focus:ring-[var(--primary)] focus:ring-2 focus:ring-offset-0"
                    />
                  </div>
                  <span className="ml-3 sm:ml-4 text-base sm:text-lg text-[var(--foreground)] group-has-[:checked]:text-[var(--primary)] transition-colors leading-relaxed">
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
          className="bg-[var(--background-tertiary)] hover:bg-[var(--border)] text-[var(--foreground)] font-medium py-3 px-6 sm:px-8 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
            className="btn-neon-purple font-medium py-3 px-6 sm:px-8 rounded-xl"
          >
            Siguiente →
          </button>
        ) : (
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting || !isExamComplete()}
            className="btn-neon-orange font-medium py-3 px-6 sm:px-8 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center">
                <div className="spinner-neon w-5 h-5 mr-3"></div>
                Enviando...
              </div>
            ) : 'Finalizar Examen'}
          </button>
        )}
      </div>

      {/* Question navigator */}
      <div className="mt-8 card-dark p-4 rounded-xl">
        <p className="text-sm text-[var(--foreground-muted)] mb-3 font-medium">Navegación de preguntas:</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const answer = userAnswers[q.id];
            const answered = q.isMultiSelect
              ? Array.isArray(answer) && answer.length > 0
              : typeof answer === 'string' && answer.length > 0;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-[var(--primary)] text-white'
                    : answered
                    ? 'bg-[var(--success-light)] text-green-700 border border-green-300'
                    : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
