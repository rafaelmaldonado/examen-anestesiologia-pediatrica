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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isTestAttempt, setIsTestAttempt] = useState(true);
  const examDurationSecondsRef = useRef(30 * 60);
  const startTimeRef = useRef<number | null>(null);
  const examDeadlineRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Use a ref (not state) to guard the timer start — prevents re-run side effects
  const timerStartedRef = useRef(false);

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
        setTimeLeft(durationSeconds);   // set before showing questions

        if (!data.questions?.length) {
          setError('No se encontraron preguntas para este examen.');
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

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await fetch('/api/auth/verify');
        if (!res.ok) return;
        const data = await res.json();
        const admin = data?.isAdmin === true;
        setIsAdminUser(admin);
        setIsTestAttempt(admin);
      } catch {
        setIsAdminUser(false);
        setIsTestAttempt(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : examDurationSecondsRef.current;

    try {
      // Include ALL questions: unanswered ones get an empty array and are scored as wrong
      const answersForApi = questions.map(q => ({
        questionId: q.id,
        selectedOptionId: userAnswers[q.id]
          ? (Array.isArray(userAnswers[q.id])
              ? (userAnswers[q.id] as string[])
              : [userAnswers[q.id] as string])
          : [],
      }));

      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificationId: certificationId as string,
          answers: answersForApi,
          timeTaken,
          isTestAttempt: isAdminUser && isTestAttempt,
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
  }, [submitting, userAnswers, questions, certificationId, router]);

  // Keep a stable ref to the latest handleSubmit so the exit-guard effect below
  // doesn't need to re-subscribe (and tear down listeners) on every answer change.
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  // Stable ref to the latest exam payload so the pagehide listener can fire
  // sendBeacon without re-attaching on every answer change.
  const examDataRef = useRef({ questions, userAnswers, certificationId, isAdminUser, isTestAttempt });
  useEffect(() => {
    examDataRef.current = { questions, userAnswers, certificationId, isAdminUser, isTestAttempt };
  }, [questions, userAnswers, certificationId, isAdminUser, isTestAttempt]);

  // Auto-submit when the page is being hidden/unloaded (tab close, app switch
  // with BFCache eviction, navigation away). Mobile browsers ignore
  // `beforeunload` and don't always fire `popstate` reliably, so without this
  // mobile users could leave an in-progress exam and re-enter — sendBeacon
  // submits whatever's answered so the server-side one-attempt rule kicks in
  // the next time they try to open the exam.
  useEffect(() => {
    if (!examStarted || submitting) return;

    const handlePageHide = () => {
      const { questions, userAnswers, certificationId, isAdminUser, isTestAttempt } = examDataRef.current;
      if (!questions.length) return;

      const timeTaken = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : examDurationSecondsRef.current;

      const answersForApi = questions.map(q => ({
        questionId: q.id,
        selectedOptionId: userAnswers[q.id]
          ? (Array.isArray(userAnswers[q.id])
              ? (userAnswers[q.id] as string[])
              : [userAnswers[q.id] as string])
          : [],
      }));

      const payload = JSON.stringify({
        certificationId: certificationId as string,
        answers: answersForApi,
        timeTaken,
        isTestAttempt: isAdminUser && isTestAttempt,
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/results', blob);
      } else {
        // Fallback for the rare browser without sendBeacon — keepalive lets
        // the request survive the page unload.
        fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [examStarted, submitting]);

  // Warn the user before leaving an in-progress exam.
  // - Closing/reloading the tab → native browser warning (can't be customized).
  // - In-app navigation (links, back button) → confirm dialog; on accept we submit
  //   the exam with the current answers and go to the results page.
  useEffect(() => {
    if (!examStarted || submitting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const message =
      'Si sales ahora, tu examen se enviará con las respuestas que llevas hasta el momento. ¿Deseas salir?';

    // Intercept clicks on internal links before Next's router handles them.
    const handleLinkClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.target === '_blank') return;
      // Allow navigation that is already heading to the results page.
      if (href.includes('/quiz/results')) return;

      e.preventDefault();
      e.stopPropagation();
      if (window.confirm(message)) {
        handleSubmitRef.current(false);
      }
    };

    // Guard the browser back button by trapping a pushed history entry.
    history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (window.confirm(message)) {
        handleSubmitRef.current(false);
      } else {
        // Re-trap: cancel the back navigation by pushing the state again.
        history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [examStarted, submitting]);

  // Start timer once — when questions are visible and loading is done.
  // Uses a ref guard so state changes never re-trigger this effect and kill the interval.
  useEffect(() => {
    if (questions.length > 0 && !loading && !timerStartedRef.current) {
      timerStartedRef.current = true;
      setExamStarted(true);
      startTimeRef.current = Date.now();
      examDeadlineRef.current = startTimeRef.current + (examDurationSecondsRef.current * 1000);
      timerRef.current = setInterval(() => {
        const deadline = examDeadlineRef.current;
        if (!deadline) return;
        const remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setTimeLeft(remainingSeconds);
        if (remainingSeconds <= 0) {
          clearInterval(timerRef.current!);
        }
      }, 1000);
    }
    // Only clean up on unmount
    return () => { clearInterval(timerRef.current!); };
  }, [questions.length, loading]); // examStarted intentionally excluded — use ref instead

  // Recalculate immediately when tab becomes visible again (background tabs throttle intervals)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !examDeadlineRef.current) return;
      const remainingSeconds = Math.max(0, Math.ceil((examDeadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Auto-submit when time runs out — only after timer has actually started and counted down
  useEffect(() => {
    if (timeLeft === 0 && examStarted && !submitting && startTimeRef.current !== null) {
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
    <div className="flex justify-center items-center min-h-[60vh] py-10">
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
        <div className="flex justify-center items-center min-h-[60vh] py-10 px-4">
          <div className="text-center card-dark p-10 rounded-2xl max-w-md">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Examen ya completado</h2>
            <p className="text-[var(--foreground-muted)] mb-6">{error}</p>
          </div>
        </div>
      );
    }

    // Exam inactive (403)
    if (errorCode === 403) {
      return (
        <div className="flex justify-center items-center min-h-[60vh] py-10 px-4">
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
      <div className="flex justify-center items-center min-h-[60vh] py-10 px-4">
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
  const isTimeLow = timeLeft !== null && timeLeft > 0 && timeLeft <= 300;
  const timeExpired = timeLeft === 0 && examStarted;

  return (
    <div className="container mx-auto px-4 pt-4 pb-44 sm:px-8 sm:pt-6 sm:pb-48 max-w-3xl">
      {/* Time expired / submitting overlay */}
      {(timeExpired || submitting) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="card-dark p-8 rounded-2xl text-center max-w-sm mx-4">
            {timeExpired ? (
              <>
                <div className="text-5xl mb-4">⏰</div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">¡Tiempo agotado!</h2>
                <p className="text-[var(--foreground-muted)] mb-4">Enviando tus respuestas...</p>
                <div className="spinner-neon w-8 h-8 mx-auto"></div>
              </>
            ) : (
              <>
                <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
                <p className="text-[var(--foreground-muted)]">Enviando resultados...</p>
              </>
            )}
          </div>
        </div>
      )}
      {/* Header with timer */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Examen</h1>
          <div className="text-sm text-[var(--foreground-muted)] mt-1">
            Respondidas: {answeredCount} / {questions.length}
          </div>
        </div>
        <div className={`text-center px-4 py-2 rounded-xl font-mono text-xl font-bold border-2 ${
          isTimeLow
            ? 'text-red-600 border-red-300 bg-red-50 animate-pulse'
            : timeLeft === 0 && examStarted
            ? 'text-red-600 border-red-400 bg-red-50'
            : 'text-[var(--foreground)] border-[var(--border)] bg-[var(--background-secondary)]'
        }`}>
          ⏱ {timeLeft === null ? '--:--' : formatTime(timeLeft)}
        </div>
      </div>

      {isTimeLow && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium text-center">
          ⚠️ ¡Quedan menos de 5 minutos! El examen se enviará automáticamente al terminar el tiempo.
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-[var(--background-tertiary)] rounded-full h-2 mb-3">
        <div
          className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="text-[var(--accent)] font-medium text-sm mb-3 text-center">
        Pregunta {currentQuestionIndex + 1} de {questions.length}
      </div>

      {isAdminUser && (
        <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isTestAttempt}
              onChange={(e) => setIsTestAttempt(e.target.checked)}
              className="mt-1 w-4 h-4"
            />
            <div>
              <div className="text-sm font-semibold text-amber-900">Guardar como intento de prueba</div>
              <div className="text-xs text-amber-700">
                Este resultado se marcará como PRUEBA y no aparecerá en reportes finales por defecto.
              </div>
            </div>
          </label>
        </div>
      )}

      <div className="card-dark p-5 sm:p-6 rounded-xl mb-4">
        <h2 className="text-base sm:text-lg font-semibold mb-3 text-[var(--foreground)] leading-relaxed">
          {currentQuestion.questionText}
        </h2>

        {currentQuestion.isMultiSelect ? (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center text-amber-800">
              <span className="text-lg mr-3">☑️</span>
              <div>
                <div className="font-semibold text-amber-900 text-sm">Selección múltiple</div>
                <div className="text-xs text-amber-700">Selecciona TODAS las respuestas correctas.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-800">
              <span className="text-lg mr-3">🔘</span>
              <div>
                <div className="font-semibold text-blue-900 text-sm">Selección única</div>
                <div className="text-xs text-blue-700">Selecciona la MEJOR respuesta.</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {currentQuestion.options.map(opt => {
            const isSelected = currentQuestion.isMultiSelect
              ? (userAnswers[currentQuestion.id] as string[] || []).includes(opt.id)
              : userAnswers[currentQuestion.id] === opt.id;
            return (
              <div key={opt.id}>
                <label className="flex items-start p-3 sm:p-4 rounded-xl border-2 border-[var(--border)] cursor-pointer transition-all hover:border-[var(--primary)] hover:bg-[var(--primary-lighter)] has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-lighter)] group">
                  <div className="flex-shrink-0 mt-0.5">
                    <input
                      type={currentQuestion.isMultiSelect ? 'checkbox' : 'radio'}
                      name={`question-${currentQuestion.id}`}
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(currentQuestion.id, opt.id, currentQuestion.isMultiSelect)}
                      className="w-4 h-4 text-[var(--primary)] bg-transparent border-2 border-[var(--border-hover)] focus:ring-[var(--primary)] focus:ring-2 focus:ring-offset-0"
                    />
                  </div>
                  <span className="ml-3 text-sm sm:text-base text-[var(--foreground)] group-has-[:checked]:text-[var(--primary)] transition-colors leading-relaxed">
                    {opt.optionText}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom: navigation buttons + question navigator */}
      <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)] -mx-4 sm:-mx-8 px-4 sm:px-8 pt-3 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
              className="bg-[var(--background-tertiary)] hover:bg-[var(--border)] text-[var(--foreground)] font-medium py-2.5 px-5 sm:px-7 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
            >
              ← Anterior
            </button>
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                className="btn-neon-purple font-medium py-2.5 px-5 sm:px-7 rounded-xl text-sm"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting || !isExamComplete()}
                className="btn-neon-orange font-medium py-2.5 px-5 sm:px-7 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="spinner-neon w-4 h-4 mr-2"></div>
                    Enviando...
                  </div>
                ) : 'Finalizar Examen'}
              </button>
            )}
          </div>

          {/* Question navigator */}
          <div className="card-dark p-3 rounded-xl">
            <p className="text-xs text-[var(--foreground-muted)] mb-2 font-medium">Navegación de preguntas:</p>
            <div className="flex flex-wrap gap-1.5">
              {questions.map((q, idx) => {
                const answer = userAnswers[q.id];
                const answered = q.isMultiSelect
                  ? Array.isArray(answer) && answer.length > 0
                  : typeof answer === 'string' && answer.length > 0;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
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
      </div>
    </div>
  );
}
