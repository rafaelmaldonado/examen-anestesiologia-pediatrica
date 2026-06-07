'use client';

import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import type { Rating, RatingStats } from '@/types';

interface RatingsDisplayProps {
  certificationId: string;
  showAllRatings?: boolean;
}

export default function RatingsDisplay({ certificationId, showAllRatings = false }: RatingsDisplayProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(showAllRatings);

  useEffect(() => {
    fetchRatings();
  }, [certificationId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ratings?certificationId=${certificationId}`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch ratings');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-[var(--border)] rounded w-32 mb-2"></div>
        <div className="h-6 bg-[var(--border)] rounded w-48"></div>
      </div>
    );
  }

  if (!stats || stats.totalRatings === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No ratings yet. Be the first to rate this certification!
      </div>
    );
  }

  const displayedRatings = showAll ? ratings : ratings.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--primary)]">
                {stats.averageRating}
              </div>
              <StarRating rating={stats.averageRating} readonly size="sm" showText={false} />
            </div>
            <div className="text-sm text-[var(--foreground-muted)]">
              Based on {stats.totalRatings} rating{stats.totalRatings !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingBreakdown[star as keyof typeof stats.ratingBreakdown];
            const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
            
            return (
              <div key={star} className="flex items-center space-x-2 text-xs">
                <span className="w-8 text-[var(--foreground-muted)]">{star} ★</span>
                <div className="flex-1 bg-[var(--background-tertiary)] rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 text-[var(--foreground-muted)] text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Ratings */}
      {displayedRatings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-[var(--foreground)]">Recent Reviews</h4>
          {displayedRatings.map((rating) => (
            <div key={rating.id} className="bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border)]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {rating.userEmail?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm text-[var(--foreground)]">
                      {rating.userEmail?.split('@')[0] || 'Anonymous'}
                    </div>
                    <StarRating rating={rating.rating} readonly size="sm" showText={false} />
                  </div>
                </div>
                <div className="text-xs text-[var(--foreground-muted)]">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </div>
              </div>
              {rating.comment && (
                <p className="text-[var(--foreground-muted)] text-sm mt-2 pl-11">
                  "{rating.comment}"
                </p>
              )}
            </div>
          ))}

          {!showAll && ratings.length > 3 && (
            <button
              onClick={() => setShowAll(true)}
              className="text-[var(--primary)] hover:text-[var(--primary-light)] text-sm transition-colors"
            >
              Show all {ratings.length} reviews →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
