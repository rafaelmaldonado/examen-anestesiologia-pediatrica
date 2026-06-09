export interface Certification {
  id: string;
  name: string;
  description: string | null;
  isActive?: boolean;             // Si el examen está activo y disponible para estudiantes
  examDurationMinutes?: number;   // Duración en minutos (default 30)
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
 * User subscription and payment interfaces
 */
export interface UserSubscription {
    id: string;
    userId: string;
    certificationId: string;
    createdAt: Date;
}

export interface UserQuizAttempt {
    id: string;
    userId: string;
    certificationId: string;
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
