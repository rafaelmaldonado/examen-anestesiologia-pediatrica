'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { safeJsonStorage } from '@/lib/storage-helper';
import type { Certification } from '@/types';

interface ResultsData {
    score: number;
    correctCount?: number;
    totalQuestions?: number;
    certificationId?: string;
    certificationName?: string;
    timeTaken?: number;
    finishedAt?: string;
}

function formatDuration(seconds?: number): string | null {
    if (seconds == null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} s`;
    return `${m} min ${s.toString().padStart(2, '0')} s`;
}

export default function ResultsPage() {
    const [results, setResults] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [certification, setCertification] = useState<Certification | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const resultsData = safeJsonStorage.getItem<ResultsData>('quizResults');
                if (resultsData) {
                    setResults(resultsData);
                    if (resultsData.certificationId) {
                        try {
                            const response = await fetch(`/api/certifications/${resultsData.certificationId}`);
                            if (response.ok) setCertification(await response.json());
                        } catch (error) {
                            console.error('Error fetching certification details:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading quiz results:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
                    <div className="text-lg font-medium text-[var(--foreground-muted)]">Cargando resultados…</div>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] px-4">
                <div className="text-center card-dark p-10 rounded-2xl max-w-md">
                    <p className="text-lg font-medium text-[var(--foreground-muted)] mb-6">No se encontraron resultados.</p>
                    <Link href="/" className="btn-neon-purple py-2.5 px-6 rounded-lg inline-block text-sm">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    const passed = results.score >= 70;
    const duration = formatDuration(results.timeTaken);

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-2xl">
            <div className="mb-6 text-center">
                <p className="text-sm font-medium text-[var(--primary)] mb-1">Resultados del examen</p>
                {(results.certificationName || certification?.name) && (
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
                        {results.certificationName || certification?.name}
                    </h1>
                )}
            </div>

            {/* Tarjeta de calificación */}
            <div className="card-dark rounded-2xl overflow-hidden mb-6 animate-fade-in-up">
                <div className={`px-6 py-5 flex items-center gap-4 ${passed ? 'bg-[var(--success-light)]' : 'bg-[var(--warning-light)]'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${passed ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'}`}>
                        {passed ? (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        ) : (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>
                        )}
                    </div>
                    <div>
                        <p className={`text-lg font-bold ${passed ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                            {passed ? 'Examen aprobado' : 'No aprobado'}
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                            {passed ? '¡Felicitaciones por tu desempeño!' : 'Sigue estudiando y vuelve a intentarlo.'}
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <span className={`text-5xl font-bold tabular-nums ${passed ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
                                {results.score}
                            </span>
                            <span className="text-2xl font-semibold text-[var(--foreground-muted)]">%</span>
                        </div>
                        {results.correctCount !== undefined && results.totalQuestions !== undefined && (
                            <p className="text-sm text-[var(--foreground-muted)] pb-1.5">
                                <span className="font-semibold text-[var(--foreground)]">{results.correctCount}</span> de {results.totalQuestions} correctas
                            </p>
                        )}
                    </div>
                    <div className="w-full bg-[var(--background-tertiary)] rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${passed ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'}`}
                            style={{ width: `${results.score}%` }}
                        ></div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-xs text-[var(--foreground-muted)]">
                        {duration && (
                            <span className="inline-flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                                Tiempo: {duration}
                            </span>
                        )}
                        {results.finishedAt && (
                            <span className="inline-flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                {new Date(results.finishedAt).toLocaleDateString('es-MX', {
                                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-center text-xs text-[var(--foreground-muted)] mb-6">
                Por la integridad del examen, no se muestran las respuestas correctas.
            </p>

            <div className="flex justify-center">
                <Link href="/" className="btn-neon-purple font-medium py-3 px-8 rounded-xl inline-flex items-center gap-2 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
