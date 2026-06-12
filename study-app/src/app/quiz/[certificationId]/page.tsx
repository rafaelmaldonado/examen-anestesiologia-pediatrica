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

  // Defeat the back-forward cache (BFCache). On mobile Chrome/Safari, tapping
  // "back" and then returning restores the frozen page straight from memory:
  // React effects don't re-run, `/api/quiz` isn't re-fetched, and the already
  // submitted exam reappears as if still open. `pageshow` with
  // `event.persisted === true` is the only signal that we were restored from
  // BFCache — when that happens we force a full reload so the server-side
  // one-attempt check (409) runs and the "Examen ya completado" screen shows.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

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

  // Tracks whether the page was hidden while an exam was in progress.
  const wasHiddenRef = useRef(false);

  // Recalculate immediately when tab becomes visible again (background tabs throttle intervals).
  //
  // On mobile, leaving the exam fires `pagehide`, which submits the in-progress
  // answers via sendBeacon — so by the time the user returns the exam is already
  // completed server-side. But the return isn't always a BFCache restore
  // (`pageshow` with persisted=true), so the React tree stays alive with the
  // stale exam visible and the user only sees "Examen ya completado" after a
  // manual refresh. To fix this, when the page becomes visible again after
  // having been hidden during an in-progress exam, force a full reload so the
  // server-side one-attempt check (409) runs and the completed screen shows.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (examStarted && !submitting) wasHiddenRef.current = true;
        return;
      }
      // visible
      if (wasHiddenRef.current && examStarted && !submitting) {
        window.location.reload();
        return;
      }
      if (!examDeadlineRef.current) return;
      const remainingSeconds = Math.max(0, Math.ceil((examDeadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [examStarted, submitting]);

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
          <div className="text-center card-dark p-10 rounded-2xl max-w-md animate-fade-in-up">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[var(--success-light)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Examen ya completado</h2>
            <p className="text-[var(--foreground-muted)] mb-6">{error}</p>
            <Link href="/" className="btn-ghost py-2.5 px-6 rounded-lg inline-block text-sm">
              Volver al inicio
            </Link>
          </div>
        </div>
      );
    }

    // Exam inactive (403)
    if (errorCode === 403) {
      return (
        <div className="flex justify-center items-center min-h-[60vh] py-10 px-4">
          <div className="text-center card-dark p-10 rounded-2xl max-w-md animate-fade-in-up">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--foreground-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Examen no disponible</h2>
            <p className="text-[var(--foreground-muted)] mb-6">{error}</p>
            <Link href="/" className="btn-neon-purple py-2.5 px-6 rounded-lg inline-block text-sm">
              Volver al inicio
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center min-h-[60vh] py-10 px-4">
        <div className="text-center card-dark p-8 rounded-2xl max-w-md animate-fade-in-up">
          <div className="text-base font-semibold text-[var(--error)] mb-4">{error}</div>
          <button onClick={() => router.push('/')} className="mt-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
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
    <div className="container mx-auto px-4 pt-5 pb-44 sm:px-8 sm:pt-6 sm:pb-48 max-w-3xl">
      {/* Time expired / submitting overlay */}
      {(timeExpired || submitting) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="card-dark p-8 rounded-2xl text-center max-w-sm mx-4">
            {timeExpired ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--error-light)] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Tiempo agotado</h2>
                <p className="text-[var(--foreground-muted)] mb-4">Enviando tus respuestas…</p>
                <div className="spinner-neon w-8 h-8 mx-auto"></div>
              </>
            ) : (
              <>
                <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
                <p className="text-[var(--foreground-muted)]">Enviando resultados…</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header: progreso + timer */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[var(--foreground)]">
              Pregunta {currentQuestionIndex + 1}
            </span>
            <span className="text-sm text-[var(--foreground-muted)]">de {questions.length}</span>
          </div>
          <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
            {answeredCount} respondida{answeredCount === 1 ? '' : 's'}
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-lg font-bold border tabular-nums transition-colors ${
          timeExpired
            ? 'text-[var(--error)] border-[var(--error)]/40 bg-[var(--error-light)]'
            : isTimeLow
            ? 'text-[var(--error)] border-[var(--error)]/30 bg-[var(--error-light)] animate-pulse'
            : 'text-[var(--foreground)] border-[var(--border)] bg-[var(--background-secondary)]'
        }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          {timeLeft === null ? '--:--' : formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[var(--background-tertiary)] rounded-full h-1.5 mb-5 overflow-hidden">
        <div
          className="bg-[var(--primary)] h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {isTimeLow && (
        <div className="mb-4 p-3 bg-[var(--error-light)] border border-[var(--error)]/30 rounded-lg text-[var(--error)] text-sm font-medium text-center">
          Quedan menos de 5 minutos. El examen se enviará automáticamente al terminar el tiempo.
        </div>
      )}

      {isAdminUser && (
        <div className="mb-4 p-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-light)]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isTestAttempt}
              onChange={(e) => setIsTestAttempt(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-semibold text-[var(--warning)]">Guardar como intento de prueba</div>
              <div className="text-xs text-[var(--foreground-muted)]">
                Este resultado se marcará como PRUEBA y no aparecerá en reportes finales por defecto.
              </div>
            </div>
          </label>
        </div>
      )}

      <div className="card-dark p-5 sm:p-6 rounded-2xl mb-4">
        {/* Etiqueta de tipo de pregunta — compacta, una sola línea */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            currentQuestion.isMultiSelect
              ? 'bg-[var(--accent-lighter)] text-[var(--accent)]'
              : 'bg-[var(--primary-lighter)] text-[var(--primary)]'
          }`}>
            {currentQuestion.isMultiSelect ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/></svg> Selección múltiple</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/></svg> Selección única</>
            )}
          </span>
          <span className="text-xs text-[var(--foreground-muted)]">
            {currentQuestion.isMultiSelect ? 'Selecciona todas las correctas' : 'Selecciona la mejor respuesta'}
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-semibold mb-5 text-[var(--foreground)] leading-relaxed">
          {currentQuestion.questionText}
        </h2>

        <div className="space-y-2.5">
          {currentQuestion.options.map((opt, optIdx) => {
            const isSelected = currentQuestion.isMultiSelect
              ? (userAnswers[currentQuestion.id] as string[] || []).includes(opt.id)
              : userAnswers[currentQuestion.id] === opt.id;
            const letter = String.fromCharCode(65 + optIdx);
            return (
              <label
                key={opt.id}
                className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-[var(--border)] cursor-pointer transition-all hover:border-[var(--border-hover)] hover:bg-[var(--background-tertiary)] has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-lighter)] group"
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] group-hover:bg-[var(--border)]'
                }`}>
                  {letter}
                </span>
                <input
                  type={currentQuestion.isMultiSelect ? 'checkbox' : 'radio'}
                  name={`question-${currentQuestion.id}`}
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => handleOptionSelect(currentQuestion.id, opt.id, currentQuestion.isMultiSelect)}
                  className="sr-only"
                />
                <span className="text-sm sm:text-base text-[var(--foreground)] group-has-[:checked]:text-[var(--primary-dark)] transition-colors leading-relaxed">
                  {opt.optionText}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom: navigation buttons + question navigator */}
      <div className="fixed bottom-0 inset-x-0 bg-[var(--background-secondary)]/95 backdrop-blur-md border-t border-[var(--border)] px-4 sm:px-8 pt-3 pb-4 z-30">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center gap-3 mb-3">
            <button
              onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
              className="btn-ghost py-2.5 px-5 sm:px-6 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-sm inline-flex items-center gap-1.5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
              Anterior
            </button>
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                className="btn-neon-purple py-2.5 px-5 sm:px-6 rounded-xl text-sm inline-flex items-center gap-1.5"
              >
                Siguiente
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting || !isExamComplete()}
                className="btn-neon-orange py-2.5 px-5 sm:px-6 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-sm inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="spinner-neon w-4 h-4"></div>
                    Enviando…
                  </>
                ) : 'Finalizar examen'}
              </button>
            )}
          </div>

          {/* Question navigator */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {questions.map((q, idx) => {
              const answer = userAnswers[q.id];
              const answered = q.isMultiSelect
                ? Array.isArray(answer) && answer.length > 0
                : typeof answer === 'string' && answer.length > 0;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  aria-label={`Ir a la pregunta ${idx + 1}${answered ? ' (respondida)' : ''}`}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    idx === currentQuestionIndex
                      ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--ring)]'
                      : answered
                      ? 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/30'
                      : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] border border-[var(--border)]'
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
  );
}
