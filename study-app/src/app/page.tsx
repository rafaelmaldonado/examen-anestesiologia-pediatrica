'use client';

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
          <div className="text-lg font-medium text-[var(--foreground-muted)]">Loading certifications...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-screen max-w-6xl">
      <div className="text-center mb-10 sm:mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-3">Study Certifications</h1>
        <p className="text-base sm:text-lg text-[var(--foreground-muted)]">Choose a certification to start your learning journey</p>
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
            return (
              <div key={cert.id} className="card-dark p-6 sm:p-8 rounded-xl h-full transition-all duration-200 group">
                <div>
                  <h2 className="mb-3 text-xl font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-200">
                    {cert.name}
                  </h2>
                  <p className="font-normal text-[var(--foreground-muted)] mb-4 leading-relaxed text-sm">
                    {cert.description || 'No description available.'}
                  </p>
                  
                  {/* Rating Display */}
                  {ratingStats && ratingStats.totalRatings > 0 ? (
                    <div className="mb-4 p-3 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <StarRating 
                          rating={ratingStats.averageRating} 
                          readonly 
                          size="sm" 
                          showText={false}
                        />
                        <span className="text-sm text-[var(--foreground-muted)]">
                          {ratingStats.averageRating} ({ratingStats.totalRatings})
                        </span>
                      </div>
                      <Link 
                        href={`/certifications/${cert.id}/ratings`}
                        className="text-xs text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors mt-1 block"
                      >
                        View all reviews →
                      </Link>
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
                      <span className="text-xs text-[var(--foreground-muted)]">No ratings yet</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {cert.isAdobe && (
                      <span className="inline-block bg-red-50 text-red-700 text-xs font-medium px-3 py-1 rounded-full border border-red-200">
                        Adobe
                      </span>
                    )}
                    {user ? (
                      <Link href={`/quiz/${cert.id}`} className="text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors duration-200 font-semibold text-sm">
                        Start Quiz →
                      </Link>
                    ) : (
                      <Link href="/auth" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors duration-200 font-semibold text-sm">
                        Sign In to Start →
                      </Link>
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
