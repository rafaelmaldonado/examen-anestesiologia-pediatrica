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
      <main className="container mx-auto p-8 min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="spinner-neon w-12 h-12 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-glow-purple">Loading Certifications...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-8 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-glow-purple pulse-glow mb-4">Study Certifications</h1>
        <p className="text-xl text-gray-300">Choose a certification to start your learning journey</p>
      </div>

      {error && (
        <div className="text-red-400 bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-8 backdrop-blur-sm">
          <div className="flex items-center">
            <span className="text-red-400">⚠️</span>
            <span className="ml-2">{error}</span>
          </div>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certifications.map((cert) => {
            const ratingStats = ratings[cert.id];
            return (
              <div key={cert.id} className="card-dark p-8 rounded-xl h-full transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <h2 className="mb-4 text-2xl font-bold tracking-tight text-glow-purple group-hover:text-glow-orange transition-all duration-300">
                    {cert.name}
                  </h2>
                  <p className="font-normal text-gray-300 mb-4 leading-relaxed">
                    {cert.description || 'No description available.'}
                  </p>
                  
                  {/* Rating Display */}
                  {ratingStats && ratingStats.totalRatings > 0 ? (
                    <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <StarRating 
                          rating={ratingStats.averageRating} 
                          readonly 
                          size="sm" 
                          showText={false}
                        />
                        <span className="text-sm text-gray-400">
                          {ratingStats.averageRating} ({ratingStats.totalRatings})
                        </span>
                      </div>
                      <Link 
                        href={`/certifications/${cert.id}/ratings`}
                        className="text-xs text-purple-400 hover:text-orange-400 transition-colors mt-1 block"
                      >
                        View all reviews →
                      </Link>
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-gray-700/20 rounded-lg border border-gray-600/20">
                      <span className="text-xs text-gray-500">No ratings yet</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {cert.isAdobe && (
                      <span className="inline-block bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-300 text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/30">
                        Adobe
                      </span>
                    )}
                    {user ? (
                      <Link href={`/quiz/${cert.id}`} className="text-purple-400 hover:text-orange-400 transition-colors duration-300 font-semibold">
                        Start Quiz →
                      </Link>
                    ) : (
                      <Link href="/auth" className="text-gray-500 hover:text-purple-400 transition-colors duration-300 font-semibold">
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
