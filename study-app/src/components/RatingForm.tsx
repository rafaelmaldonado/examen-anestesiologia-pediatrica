'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import type { Certification } from '@/types';

interface RatingFormProps {
  certification: Certification;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function RatingForm({ 
  certification, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    await onSubmit(rating, comment);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-xl p-6 max-w-md w-full mx-4 border border-[var(--border)] shadow-lg">
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Rate Your Experience
        </h3>
        
        <div className="mb-4">
          <p className="text-[var(--foreground-muted)] mb-2">
            How would you rate the <span className="font-medium text-[var(--primary)]">{certification.name}</span> certification?
          </p>
          <div className="flex justify-center mb-4">
            <StarRating 
              rating={rating} 
              onRatingChange={setRating}
              size="lg"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Comments (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this certification..."
              rows={4}
              className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-lighter)]"
              maxLength={500}
            />
            <div className="text-right text-xs text-[var(--foreground-muted)] mt-1">
              {comment.length}/500
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--foreground-muted)] rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-2 btn-neon-purple rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
