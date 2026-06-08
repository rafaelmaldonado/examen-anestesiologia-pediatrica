'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

interface HistoryResult {
  id: string;
  userId: string;
  certificationId: string;
  certificationName?: string;
  score: number;
  createdAt: Date;
}

export default function HistoryPage() {
  const [results, setResults] = useState<HistoryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setError('Please log in to view your history');
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        if (!res.ok) {
          throw new Error('Failed to fetch history');
        }
        const data = await res.json();
        setResults(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-[var(--foreground-muted)]">Cargando historial...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center card-dark p-8 rounded-xl">
          <p className="text-lg font-medium text-[var(--error)] mb-4">{error}</p>
          <Link href="/">
            <span className="btn-neon-purple py-2 px-6 rounded-lg inline-block">Volver al inicio</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalQuizzes = results.length;
  const averageScore = totalQuizzes > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalQuizzes) : 0;
  const bestScore = totalQuizzes > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const recentResults = results.slice(0, 10);

  // Group results by certification for progress tracking
  const progressByPlatform = results.reduce((acc, result) => {
    const name = result.certificationName || 'Unknown';
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(result);
    return acc;
  }, {} as Record<string, HistoryResult[]>);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--foreground)]">Historial de Exámenes</h1>
        <p className="text-[var(--foreground-muted)]">Sigue tu progreso a lo largo del tiempo</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="card-dark p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-[var(--primary)] mb-1">{totalQuizzes}</div>
          <div className="text-sm text-[var(--foreground-muted)]">Total de exámenes</div>
        </div>
        <div className="card-dark p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-[var(--accent)] mb-1">{averageScore}%</div>
          <div className="text-sm text-[var(--foreground-muted)]">Calificación promedio</div>
        </div>
        <div className="card-dark p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-[var(--success)] mb-1">{bestScore}%</div>
          <div className="text-sm text-[var(--foreground-muted)]">Mejor calificación</div>
        </div>
      </div>

      {totalQuizzes === 0 ? (
        <div className="text-center card-dark p-10 sm:p-12 rounded-xl">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">Sin historial de exámenes</h2>
          <p className="text-[var(--foreground-muted)] mb-6">¡Comienza a tomar exámenes para ver tu progreso!</p>
          <Link href="/">
            <span className="btn-neon-purple py-3 px-8 rounded-lg inline-block">Tomar mi primer examen</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Progress by Certification */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-5">Progreso por Examen</h2>
            <div className="space-y-5">
              {Object.entries(progressByPlatform).map(([certName, certResults]) => {
                const sortedResults = certResults.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                const latestScore = sortedResults[sortedResults.length - 1]?.score || 0;
                const improvement = sortedResults.length > 1 ? latestScore - sortedResults[0].score : 0;
                
                return (
                  <div key={certName} className="card-dark p-5 sm:p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">{certName}</h3>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-[var(--foreground-muted)]">{certResults.length} intentos</span>
                        {improvement > 0 && (
                          <span className="text-green-600 text-sm font-medium">↗️ +{improvement}%</span>
                        )}
                        {improvement < 0 && (
                          <span className="text-red-600 text-sm font-medium">↘️ {improvement}%</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Chart */}
                    {sortedResults.length > 0 ? (
                      <div className="flex items-end space-x-2 h-20 mb-4 bg-[var(--background-secondary)] rounded-lg p-2">
                        {sortedResults.slice(-8).map((result, index) => {
                          const height = Math.max((result.score / 100) * 100, 8);
                          return (
                            <div key={result.id} className="flex-1 flex flex-col items-center justify-end h-full">
                              <div 
                                className={`w-full rounded-t transition-all duration-500 hover:scale-105 cursor-pointer ${
                                  result.score >= 75 ? 'bg-[var(--success)]' : 
                                  result.score >= 50 ? 'bg-[var(--accent)]' : 
                                  'bg-[var(--error)]'
                                }`}
                                style={{ height: `${height}%` }}
                                title={`${result.score}% on ${new Date(result.createdAt).toLocaleDateString()}`}
                              ></div>
                              <span className="text-xs text-[var(--foreground-muted)] mt-1 font-medium">{result.score}%</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-20 mb-4 bg-[var(--background-secondary)] rounded-lg p-4 flex items-center justify-center">
                        <span className="text-[var(--foreground-muted)] text-sm">Sin datos disponibles</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-[var(--foreground-muted)]">
                      Última: {latestScore}% • Mejor: {Math.max(...certResults.map(r => r.score))}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Results */}
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-5">Resultados Recientes</h2>
            <div className="space-y-4">
              {recentResults.map((result) => (
                <div key={result.id} className="card-dark p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm ${
                      result.score >= 75 ? 'bg-[var(--success-light)] text-green-700' :
                      result.score >= 50 ? 'bg-[var(--accent-lighter)] text-amber-700' :
                      'bg-[var(--error-light)] text-red-700'
                    }`}>
                      {result.score}%
                    </div>
                    <div>
                      <h3 className="font-medium text-[var(--foreground)]">{result.certificationName || 'Examen desconocido'}</h3>
                      <p className="text-sm text-[var(--foreground-muted)]">{new Date(result.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.score >= 75 && <span className="text-green-600">🏆</span>}
                    {result.score >= 90 && <span className="text-amber-500">⭐</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="text-center mt-12">
        <Link href="/">
          <span className="btn-neon-purple font-medium py-3 px-8 rounded-lg">
            🏠 Back to Home
          </span>
        </Link>
      </div>
    </div>
  );
}
