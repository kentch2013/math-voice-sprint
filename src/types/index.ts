export interface MathProblem {
  id: string;
  operandA: number;
  operandB: number;
  expectedAnswer: number;
}

export interface QuestionResult {
  questionId: string;
  problem: string; // "6 x 7"
  expectedAnswer: number;
  userAnswer?: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  inputMethod: 'voice' | 'keypad' | 'timeout';
  attemptsCount: number;
}

export interface GameSession {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  totalQuestions: number;
  correctCount: number;
  totalDurationSeconds: number;
  results: QuestionResult[];
}

export interface UserProfile {
  id: string;
  displayName: string;
  sessions: GameSession[];
}
