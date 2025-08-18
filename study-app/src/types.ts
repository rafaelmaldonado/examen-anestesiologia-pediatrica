export interface Certification {
  id: number;
  name: string;
  description: string | null;
  isAdobe: boolean;
}

export interface Option {
    id: number;
    optionText: string;
}

export interface Question {
    id: number;
    certificationId: number;
    questionText: string;
    options: Option[];
}
