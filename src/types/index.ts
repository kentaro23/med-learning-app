export interface CardSet {
  id: string;
  title: string;
  description?: string;
  visibility: string;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner: User;
  cards: Card[];
  _count?: {
    cards: number;
    likes: number;
    bookmarks: number;
  };
}

export interface Card {
  id: string;
  question: string;
  answer: string;
  source?: string;
  cardSetId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  createdAt: Date;
}

export interface Doc {
  id: string;
  title: string;
  visibility: string;
  sourceName?: string;
  textHash: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner: User;
  clozes: Cloze[];
}

export interface Cloze {
  id: string;
  content: string;
  meta?: string;
  docId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIQuestionRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}

export interface AIQuestionResponse {
  questions: Array<{
    question: string;
    answer: string;
    explanation?: string;
  }>;
}
