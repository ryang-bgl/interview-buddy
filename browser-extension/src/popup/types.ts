export interface PageProblemDetails {
  problemNumber: string;
  problemTitle: string;
  href: string;
  descriptionHtml?: string;
  descriptionText?: string;
  language?: string;
  solutionCode?: string;
  difficulty?: string;
}

export interface PopupFormState {
  url: string;
  problemNumber: string;
  title: string;
  description: string;
  code: string;
  idealSolution?: string;
  notes: string;
  language?: string;
  difficulty?: string;
}

export type PopupStorageMap = Record<string, PopupFormState>;
