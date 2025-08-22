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
          <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-glow-purple">Loading History...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center card-dark p-8 rounded-2xl">
          <p className="text-xl font-semibold text-red-400 mb-4">{error}</p>
          <Link href="/">
            <span className="btn-neon-purple py-2 px-6 rounded-lg inline-block">Go back to home</span>
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
    <div className="container mx-auto p-4 sm:p-8 max-w-6xl min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-glow-purple">Quiz History & Progress</h1>
        <p className="text-gray-300">Track your learning journey and improvement over time</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-dark p-6 rounded-xl text-center">
          <div className="text-3xl font-bold text-glow-cyan mb-2">{totalQuizzes}</div>
          <div className="text-gray-400">Total Quizzes</div>
        </div>
        <div className="card-dark p-6 rounded-xl text-center">
          <div className="text-3xl font-bold text-glow-orange mb-2">{averageScore}%</div>
          <div className="text-gray-400">Average Score</div>
        </div>
        <div className="card-dark p-6 rounded-xl text-center">
          <div className="text-3xl font-bold text-glow-purple mb-2">{bestScore}%</div>
          <div className="text-gray-400">Best Score</div>
        </div>
      </div>

      {totalQuizzes === 0 ? (
        <div className="text-center card-dark p-12 rounded-2xl">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-4">No Quiz History Yet</h2>
          <p className="text-gray-400 mb-6">Start taking quizzes to track your progress!</p>
          <Link href="/">
            <span className="btn-neon-purple py-3 px-8 rounded-lg inline-block">Take Your First Quiz</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Progress by Certification */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Progress by Certification</h2>
            <div className="space-y-6">
              {Object.entries(progressByPlatform).map(([certName, certResults]) => {
                const sortedResults = certResults.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                const latestScore = sortedResults[sortedResults.length - 1]?.score || 0;
                const improvement = sortedResults.length > 1 ? latestScore - sortedResults[0].score : 0;
                
                return (
                  <div key={certName} className="card-dark p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-200">{certName}</h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-400">{certResults.length} attempts</span>
                        {improvement > 0 && (
                          <span className="text-green-400 text-sm">↗️ +{improvement}%</span>
                        )}
                        {improvement < 0 && (
                          <span className="text-red-400 text-sm">↘️ {improvement}%</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Chart */}
                    {sortedResults.length > 0 ? (
                      <div className="flex items-end space-x-2 h-20 mb-4 bg-gray-800/20 rounded-lg p-2">
                        {sortedResults.slice(-8).map((result, index) => {
                          const height = Math.max((result.score / 100) * 100, 8); // Minimum height of 8%
                          return (
                            <div key={result.id} className="flex-1 flex flex-col items-center justify-end h-full">
                              <div 
                                className={`w-full rounded-t transition-all duration-500 hover:scale-105 cursor-pointer ${
                                  result.score >= 75 ? 'bg-gradient-to-t from-green-500 to-cyan-400 shadow-lg shadow-green-500/30' : 
                                  result.score >= 50 ? 'bg-gradient-to-t from-orange-500 to-yellow-400 shadow-lg shadow-orange-500/30' : 
                                  'bg-gradient-to-t from-red-500 to-orange-400 shadow-lg shadow-red-500/30'
                                }`}
                                style={{ height: `${height}%` }}
                                title={`${result.score}% on ${new Date(result.createdAt).toLocaleDateString()}`}
                              ></div>
                              <span className="text-xs text-gray-400 mt-1 font-semibold">{result.score}%</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-20 mb-4 bg-gray-800/20 rounded-lg p-4 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No quiz data available</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-400">
                      Latest: {latestScore}% • Best: {Math.max(...certResults.map(r => r.score))}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Results */}
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Recent Results</h2>
            <div className="space-y-4">
              {recentResults.map((result) => (
                <div key={result.id} className="card-dark p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      result.score >= 75 ? 'bg-green-500/20 text-green-400' :
                      result.score >= 50 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {result.score}%
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-200">{result.certificationName || 'Unknown Certification'}</h3>
                      <p className="text-sm text-gray-400">{new Date(result.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.score >= 75 && <span className="text-green-400">🏆</span>}
                    {result.score >= 90 && <span className="text-yellow-400">⭐</span>}
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
          <span className="btn-neon-purple font-bold py-3 px-8 rounded-lg">
            🏠 Back to Home
          </span>
        </Link>
      </div>
    </div>
  );
}
