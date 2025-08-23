'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

      // Fetch question counts for each certification
      const statsPromises = certifications.map(async (cert) => {
        const questionsResponse = await fetch(`/api/questions?certificationId=${cert.id}`);
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
          <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-glow-purple">Loading Statistics...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalQuestions = stats.reduce((sum, cert) => sum + cert.questionCount, 0);

  return (
    <div className="container mx-auto p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin" className="text-purple-400 hover:text-orange-400 transition-colors mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-glow-purple">Certification Statistics</h1>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card-dark p-6 rounded-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-glow-orange">{stats.length}</div>
            <div className="text-gray-300">Total Certifications</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-glow-purple">{totalQuestions}</div>
            <div className="text-gray-300">Total Questions</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-glow-blue">
              {stats.length > 0 ? Math.round(totalQuestions / stats.length) : 0}
            </div>
            <div className="text-gray-300">Avg Questions per Cert</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-200 mb-6">Questions per Certification</h2>
        {stats.map((cert) => (
          <div key={cert.id} className="card-dark p-6 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-glow-orange mb-2">{cert.name}</h3>
                <p className="text-gray-300 mb-4">{cert.description}</p>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-glow-purple">
                    {cert.questionCount} questions
                  </span>
                  <Link 
                    href={`/admin/questions/${cert.id}`}
                    className="btn-secondary text-sm"
                  >
                    Manage Questions
                  </Link>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-glow-blue">{cert.questionCount}</div>
                  <div className="text-sm text-gray-400">questions</div>
                </div>
              </div>
            </div>
            
            {/* Progress bar showing relative question count */}
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-orange-500 h-2 rounded-full transition-all duration-300"
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
  );
}
