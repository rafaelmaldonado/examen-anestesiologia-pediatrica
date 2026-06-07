'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import StarRating from '@/components/StarRating';

interface Certification {
  id: string;
  name: string;
  description: string;
}

interface CertificationStats {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  averageRating?: number;
  totalRatings?: number;
}

export default function AdminStatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CertificationStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchStats();
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    try {
      // Fetch certifications
      const certsResponse = await fetch('/api/certifications');
      const certifications: Certification[] = await certsResponse.json();

      // Fetch question counts and ratings for each certification
      const statsPromises = certifications.map(async (cert) => {
        const [questionsResponse, ratingsResponse] = await Promise.all([
          fetch(`/api/questions?certificationId=${cert.id}`),
          fetch(`/api/ratings?certificationId=${cert.id}`)
        ]);
        
        const questions = await questionsResponse.json();
        let averageRating = 0;
        let totalRatings = 0;
        
        if (ratingsResponse.ok) {
          const ratingsData = await ratingsResponse.json();
          averageRating = ratingsData.stats?.averageRating || 0;
          totalRatings = ratingsData.stats?.totalRatings || 0;
        }
        
        return {
          ...cert,
          questionCount: questions.length,
          averageRating,
          totalRatings
        };
      });

      const certificationStats = await Promise.all(statsPromises);
      setStats(certificationStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-[var(--foreground-muted)]">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalQuestions = stats.reduce((sum, cert) => sum + cert.questionCount, 0);

  return (
    <AdminGuard>
      <div className="container mx-auto p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin" className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors mb-2 inline-block text-sm">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Certification Statistics</h1>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card-dark p-6 rounded-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-[var(--accent)]">{stats.length}</div>
            <div className="text-sm text-[var(--foreground-muted)]">Total Certifications</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--primary)]">{totalQuestions}</div>
            <div className="text-sm text-[var(--foreground-muted)]">Total Questions</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--success)]">
              {stats.length > 0 ? Math.round(totalQuestions / stats.length) : 0}
            </div>
            <div className="text-sm text-[var(--foreground-muted)]">Avg Questions per Cert</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-5">Questions per Certification</h2>
        {stats.map((cert) => (
          <div key={cert.id} className="card-dark p-6 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{cert.name}</h3>
                <p className="text-[var(--foreground-muted)] text-sm mb-3">{cert.description}</p>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-[var(--primary)]">
                    {cert.questionCount} questions
                  </span>
                  {cert.totalRatings && cert.totalRatings > 0 && (
                    <div className="flex items-center space-x-2">
                      <StarRating 
                        rating={cert.averageRating || 0} 
                        readonly 
                        size="sm" 
                        showText={false}
                      />
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {cert.averageRating?.toFixed(1)} ({cert.totalRatings})
                      </span>
                    </div>
                  )}
                  <Link 
                    href={`/admin/questions/${cert.id}`}
                    className="text-[var(--primary)] hover:text-[var(--primary-light)] text-sm font-medium transition-colors"
                  >
                    Manage Questions
                  </Link>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--primary)]">{cert.questionCount}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">questions</div>
                  {cert.totalRatings && cert.totalRatings > 0 && (
                    <div className="mt-2">
                      <div className="text-lg font-bold text-amber-500">
                        {cert.averageRating?.toFixed(1)}⭐
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)]">{cert.totalRatings} ratings</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="w-full bg-[var(--background-tertiary)] rounded-full h-1.5">
                <div 
                  className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: totalQuestions > 0 ? `${(cert.questionCount / Math.max(...stats.map(s => s.questionCount))) * 100}%` : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </AdminGuard>
  );
}
