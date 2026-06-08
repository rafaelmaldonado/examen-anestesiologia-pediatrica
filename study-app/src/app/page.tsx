'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from './providers';
import type { Certification, RatingStats } from '@/types';
import StarRating from '@/components/StarRating';

export default function HomePage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: RatingStats }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/certifications', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to fetch certifications');
        }
        const data = await res.json();
        setCertifications(data);

        // Fetch ratings for each certification
        const ratingsPromises = data.map(async (cert: Certification) => {
          try {
            const ratingRes = await fetch(`/api/ratings?certificationId=${cert.id}`);
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              return { certificationId: cert.id, stats: ratingData.stats };
            }
          } catch (error) {
            console.error(`Error fetching ratings for ${cert.id}:`, error);
          }
          return null;
        });

        const ratingsResults = await Promise.all(ratingsPromises);
        const ratingsMap: { [key: string]: RatingStats } = {};
        ratingsResults.forEach((result) => {
          if (result) {
            ratingsMap[result.certificationId] = result.stats;
          }
        });
        setRatings(ratingsMap);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto p-6 sm:p-8 min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="spinner-neon w-10 h-10 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-[var(--foreground-muted)]">Cargando exámenes...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-screen max-w-6xl">
      <div className="text-center mb-10 sm:mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-3">Examen Anestesiología Pediátrica</h1>
        <p className="text-base sm:text-lg text-[var(--foreground-muted)]">Selecciona un examen para comenzar</p>
      </div>

      {error && (
        <div className="text-[var(--error)] bg-[var(--error-light)] border border-red-200 p-4 rounded-lg mb-8">
          <div className="flex items-center">
            <span>⚠️</span>
            <span className="ml-2">{error}</span>
          </div>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certifications.map((cert) => {
            const ratingStats = ratings[cert.id];
            const isActive = cert.isActive !== false;
            return (
              <div key={cert.id} className={`card-dark p-6 sm:p-8 rounded-xl h-full transition-all duration-200 group ${!isActive ? 'opacity-60' : ''}`}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-200">
                      {cert.name}
                    </h2>
                    {!isActive && (
                      <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-300 whitespace-nowrap">
                        🔒 Inactivo
                      </span>
                    )}
                  </div>
                  <p className="font-normal text-[var(--foreground-muted)] mb-4 leading-relaxed text-sm">
                    {cert.description || ''}
                  </p>

                  <div className="flex items-center justify-between">
                    {isActive ? (
                      user ? (
                        <Link href={`/quiz/${cert.id}`} className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors duration-200 font-semibold text-sm">
                          Iniciar Examen →
                        </Link>
                      ) : (
                        <Link href="/auth" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors duration-200 font-semibold text-sm">
                          Inicia sesión para comenzar →
                        </Link>
                      )
                    ) : (
                      <span className="text-gray-400 text-sm cursor-not-allowed">
                        Examen no disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
