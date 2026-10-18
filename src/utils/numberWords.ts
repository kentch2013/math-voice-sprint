const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS_NUMBERS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fourty: 40, // Common misspelling/variant in speech recognition
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/**
 * Parses a numeric value from a child's spoken utterance.
 * Handles digits ("24"), hyphenated/compound words ("twenty-four", "twenty four", "forty two", "fourty-two"),
 * and single word numbers ("sixteen", "81").
 */
export function parseNumberFromUtterance(utterance: string): number | null {
  if (!utterance) return null;

  const normalized = utterance
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim();

  // 1. Look for direct digits in text (e.g. "it's 24", "42")
  const digitMatch = normalized.match(/\b\d+\b/);
  if (digitMatch) {
    const num = parseInt(digitMatch[0], 10);
    if (!isNaN(num)) return num;
  }

  // 2. Tokenize words and test multi-word or compound word number phrases
  const words = normalized.replace(/-/g, ' ').split(/\s+/).filter(Boolean);

  // Check word pairs for tens + ones (e.g. "twenty four", "forty two")
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    if (TENS_NUMBERS[w1] !== undefined && SMALL_NUMBERS[w2] !== undefined) {
      return TENS_NUMBERS[w1] + SMALL_NUMBERS[w2];
    }
  }

  // Check for standalone tens words (e.g. "twenty")
  for (const word of words) {
    if (TENS_NUMBERS[word] !== undefined) {
      return TENS_NUMBERS[word];
    }
  }

  // Check for small numbers / teens (e.g. "twelve", "sixteen", "four")
  for (const word of words) {
    if (SMALL_NUMBERS[word] !== undefined) {
      return SMALL_NUMBERS[word];
    }
  }

  return null;
}
