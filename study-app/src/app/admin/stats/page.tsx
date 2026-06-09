'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';

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
        const [questionsResponse] = await Promise.all([
          fetch(`/api/questions?certificationId=${cert.id}`)
        ]);
        
        const questions = await questionsResponse.json();
        
        return {
          ...cert,
          questionCount: questions.length
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
          <div className="text-lg font-medium text-[var(--foreground-muted)]">Cargando estadísticas...</div>
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
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
        <div>
          <Link href="/admin" className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors mb-2 inline-block text-sm">
            ← Volver al Panel Admin
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Estadísticas de Exámenes</h1>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card-dark p-5 sm:p-6 rounded-xl mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-[var(--accent)]">{stats.length}</div>
            <div className="text-sm text-[var(--foreground-muted)]">Total de Exámenes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--primary)]">{totalQuestions}</div>
            <div className="text-sm text-[var(--foreground-muted)]">Total de Preguntas</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--success)]">
              {stats.length > 0 ? Math.round(totalQuestions / stats.length) : 0}
            </div>
            <div className="text-sm text-[var(--foreground-muted)]">Promedio de Preguntas por Examen</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-4 sm:mb-5">Preguntas por Examen</h2>
        {stats.map((cert) => (
          <div key={cert.id} className="card-dark p-4 sm:p-6 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2">{cert.name}</h3>
                <p className="text-[var(--foreground-muted)] text-sm mb-3">{cert.description}</p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className="text-sm font-medium text-[var(--primary)]">
                    {cert.questionCount} {cert.questionCount === 1 ? 'pregunta' : 'preguntas'}
                  </span>
                  <Link
                    href={`/admin/questions/${cert.id}`}
                    className="text-[var(--primary)] hover:text-[var(--primary-light)] text-sm font-medium transition-colors"
                  >
                    Administrar Preguntas
                  </Link>
                </div>
              </div>
              <div className="sm:ml-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--primary)]">{cert.questionCount}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">preguntas</div>
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
