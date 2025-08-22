export interface Certification {
  id: string;
  name: string;
  description: string | null;
  isAdobe: boolean;
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
}
