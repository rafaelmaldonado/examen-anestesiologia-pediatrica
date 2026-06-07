export interface Certification {
  id: string;
  name: string;
  description: string | null;
  isAdobe: boolean;
  price?: number; // Price in cents (USD)
  isFree?: boolean; // Whether the course is completely free
}

/**
 * Option type for the client-side quiz (publicly visible)
 */
export interface ClientOption {
    id: string;
    optionText: string;
}

/**
 * Full Option type for the admin panel
 */
export interface AdminOption {
    id: string;
    optionText: string;
    isCorrect: boolean;
    explanation?: string | null;
}

export interface Question {
    id: string;
    questionText: string;
    options: AdminOption[];
    isMultiSelect?: boolean; // New field to indicate if multiple answers are allowed
}

/**
 * Rating interface for course ratings
 */
export interface Rating {
    id: string;
    userId: string;
    userEmail: string;
    certificationId: string;
    rating: number; // 1-5 stars
    comment?: string;
    createdAt: Date;
}

/**
 * Rating statistics for a certification
 */
export interface RatingStats {
    certificationId: string;
    averageRating: number;
    totalRatings: number;
    ratingBreakdown: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

/**
 * User subscription and payment interfaces
 */
export interface UserSubscription {
    id: string;
    userId: string;
    certificationId: string;
    stripeCustomerId?: string;
    stripePaymentIntentId?: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    amount: number; // Amount in cents
    createdAt: Date;
    paidAt?: Date;
}

export interface UserQuizAttempt {
    id: string;
    userId: string;
    certificationId: string;
    isFreeAttempt: boolean;
    createdAt: Date;
}

export interface ExamResult {
    id?: string;
    userId: string;
    certificationId: string;
    certificationName?: string;
    score: number;
    timeTaken?: number; // segundos
    createdAt: Date;
}
