export interface Question {
  id: string | number;
  text: string;
  options: string[];
  correctAnswer: number; // 0-3 for A-D
}

export interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
}

export type GameMode = '1v1' | '2v2';

export interface GameConfig {
  duration: number; // in seconds
  mode: GameMode;
  questionSetId: string;
}

export type GameState = 'waiting' | 'playing' | 'finished';

export interface PlayerState {
  id: string;
  name: string;
  index: number;
  team: 'A' | 'B';
  score: number;
  status: 'idle' | 'answering' | 'swinging' | 'stunned';
  stunUntil?: number;
  askedQuestions: (string | number)[]; // Track IDs of questions already asked to this player
}

export interface Item {
  id: string;
  type: 'gold_small' | 'gold_medium' | 'gold_large' | 'diamond' | 'stone' | 'mine' | 'mole' | 'trash';
  x: number;
  y: number;
  radius: number;
  points: number;
  weight: number; // affects pull speed
  velocityX?: number; // for moving items like moles
}
