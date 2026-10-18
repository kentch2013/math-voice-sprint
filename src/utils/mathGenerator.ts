import type { MathProblem } from '../types';

/**
 * Fisher-Yates shuffle algorithm to randomize array elements in place.
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Generates math problems with commutative pair uniqueness.
 * Operands are strictly in [2, 9].
 * Exactly `count` (default 10) problems per round.
 */
export function generateMathProblems(count: number = 10): MathProblem[] {
  const uniquePairs: [number, number][] = [];

  // Generate all unique unordered pairs {a, b} where 2 <= a <= b <= 9
  for (let a = 2; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      uniquePairs.push([a, b]);
    }
  }

  // Shuffle the commutative pairs
  const shuffledPairs = fisherYatesShuffle(uniquePairs);

  // Take the first `count` pairs
  const selectedPairs = shuffledPairs.slice(0, count);

  // Randomize orientation (a x b vs b x a) for each pair, and shuffle final problem order
  const problems: MathProblem[] = selectedPairs.map((pair, index) => {
    const flip = Math.random() < 0.5;
    const operandA = flip ? pair[1] : pair[0];
    const operandB = flip ? pair[0] : pair[1];

    return {
      id: `prob-${index + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      operandA,
      operandB,
      expectedAnswer: operandA * operandB,
    };
  });

  return fisherYatesShuffle(problems);
}
