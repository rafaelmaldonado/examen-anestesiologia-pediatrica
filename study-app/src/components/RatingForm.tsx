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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <h3 className="text-xl font-bold text-glow-purple mb-4">
          Rate Your Experience
        </h3>
        
        <div className="mb-4">
          <p className="text-gray-300 mb-2">
            How would you rate the <span className="text-glow-orange">{certification.name}</span> certification?
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
            <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">
              Comments (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this certification..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {comment.length}/500
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
