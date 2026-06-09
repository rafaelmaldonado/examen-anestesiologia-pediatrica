'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeJsonStorage } from '@/lib/storage-helper';
import type { Certification } from '@/types';

// Define a more specific type for the results data
interface ResultDetails {
    questionId: string;
    questionText: string;
    selectedOptionId: string[]; // Changed to array for multi-select support
    correctOptions: Array<{
        id: string;
        optionText: string;
        isCorrect: boolean;
        explanation?: string | null;
    }>;
    isCorrect: boolean;
    allOptions: any[];
    isMultiSelect?: boolean;
}

interface ResultsData {
    score: number;
    correctCount?: number;
    totalQuestions?: number;
    results: ResultDetails[];
    certificationId?: string;
    certificationName?: string;
    timeTaken?: number;
    finishedAt?: string;
}

export default function ResultsPage() {
    const [results, setResults] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [certification, setCertification] = useState<Certification | null>(null);
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            try {
                const resultsData = safeJsonStorage.getItem<ResultsData>('quizResults');
                if (resultsData) {
                    setResults(resultsData);
                    
                    // If we have certification info, fetch the full certification details
                    if (resultsData.certificationId) {
                        try {
                            const response = await fetch(`/api/certifications/${resultsData.certificationId}`);
                            if (response.ok) {
                                const certData = await response.json();
                                setCertification(certData);
                            }
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
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
                    <div className="text-lg font-medium text-[var(--foreground-muted)]">Cargando resultados...</div>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="text-center card-dark p-8 rounded-xl">
                    <p className="text-lg font-medium text-[var(--foreground-muted)] mb-4">No se encontraron resultados.</p>
                    <Link href="/">
                        <span className="btn-neon-purple py-2 px-6 rounded-lg inline-block">Volver al inicio</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
            <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--foreground)]">Resultados del Examen</h1>
                <p className="text-[var(--foreground-muted)]">Así fue tu desempeño en el examen</p>
            </div>
            
            <div className="text-center mb-8 card-dark p-8 rounded-xl">
                <p className="text-lg text-[var(--foreground-muted)] mb-3">Calificación Final:</p>
                <p className={`text-6xl font-bold mb-2 ${results.score >= 75 ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
                    {results.score}%
                </p>
                {results.correctCount !== undefined && results.totalQuestions !== undefined && (
                    <p className="text-xl font-semibold text-[var(--foreground)] mb-4">
                        {results.correctCount} de {results.totalQuestions} respuestas correctas
                    </p>
                )}
                <div className="w-full bg-[var(--background-tertiary)] rounded-full h-2.5 mb-4">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-1000 ${results.score >= 75 ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'}`}
                        style={{width: `${results.score}%`}}
                    ></div>
                </div>
                <p className="text-[var(--foreground-muted)]">
                    {results.score >= 75 ? '🎉 ¡Felicitaciones! Aprobaste el examen.' : '📚 Sigue estudiando y vuelve a intentarlo.'}
                </p>
                {results.finishedAt && (
                    <p className="text-xs text-[var(--foreground-muted)] mt-3">
                        Terminado el {new Date(results.finishedAt).toLocaleDateString('es-MX', {
                            day: '2-digit', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                )}
            </div>

            <div className="text-center mt-12">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/">
                        <span className="btn-neon-purple font-medium py-3 px-8 rounded-lg">
                            🏠 Volver al inicio
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
