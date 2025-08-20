export interface Certification {
  id: string;
  name: string;
  description: string | null;
  isAdobe: boolean;
}

export interface Option {
    id: string;
    optionText: string;
}

export interface Question {
    id: string;
    questionText: string;
    options: Option[];
}
