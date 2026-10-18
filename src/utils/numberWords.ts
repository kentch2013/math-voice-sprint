const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  four: 4,
  for: 4,
  fore: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
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
  fourty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/**
 * Extracts all numbers mentioned in an utterance.
 * Handles digits ("24"), homophones ("for", "ate", "to"), compound words ("forty two", "forty-two"),
 * and single words ("twelve", "81").
 * Returns an array of numbers in order of appearance.
 */
export function extractNumbersFromUtterance(utterance: string): number[] {
  if (!utterance) return [];

  const normalized = utterance
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .trim();

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const foundNumbers: number[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // 1. Direct digit tokens (e.g. "42", "6", "18")
    if (/^\d+$/.test(token)) {
      foundNumbers.push(parseInt(token, 10));
      i++;
      continue;
    }

    // 2. Check compound tens + ones (e.g. "forty two", "twenty-four", "twenty 1") or digit ones
    if (TENS_NUMBERS[token] !== undefined) {
      if (i + 1 < tokens.length) {
        const nextToken = tokens[i + 1];
        if (SMALL_NUMBERS[nextToken] !== undefined && SMALL_NUMBERS[nextToken] < 10) {
          foundNumbers.push(TENS_NUMBERS[token] + SMALL_NUMBERS[nextToken]);
          i += 2;
          continue;
        }
        if (/^\d+$/.test(nextToken)) {
          const val = parseInt(nextToken, 10);
          if (val >= 0 && val < 10) {
            foundNumbers.push(TENS_NUMBERS[token] + val);
            i += 2;
            continue;
          }
        }
      }
      foundNumbers.push(TENS_NUMBERS[token]);
      i++;
      continue;
    }

    // 2b. Check digit tens + small word ones (e.g. "20 five" or "20 5")
    if (/^\d+$/.test(token)) {
      const val = parseInt(token, 10);
      if (val >= 20 && val <= 90 && val % 10 === 0) {
        if (i + 1 < tokens.length) {
          const nextToken = tokens[i + 1];
          if (SMALL_NUMBERS[nextToken] !== undefined && SMALL_NUMBERS[nextToken] < 10) {
            foundNumbers.push(val + SMALL_NUMBERS[nextToken]);
            i += 2;
            continue;
          }
        }
      }
    }

    // 3. Small numbers / teens / homophones (e.g. "sixteen", "eight", "for" -> 4)
    if (SMALL_NUMBERS[token] !== undefined) {
      foundNumbers.push(SMALL_NUMBERS[token]);
      i++;
      continue;
    }

    i++;
  }

  return foundNumbers;
}

/**
 * Checks if a target number was spoken in an utterance.
 * Checks direct number presence, word matches, and substrings.
 */
export function checkUtteranceMatchesAnswer(utterance: string, expectedAnswer: number): boolean {
  if (!utterance) return false;

  const numbers = extractNumbersFromUtterance(utterance);
  if (numbers.includes(expectedAnswer)) {
    return true;
  }

  // Regex boundary match for exact integer in the raw utterance
  const regex = new RegExp(`\\b${expectedAnswer}\\b`);
  if (regex.test(utterance)) {
    return true;
  }

  return false;
}

/**
 * Legacy helper maintained for interface compatibility.
 * Returns the most recent/relevant number extracted from utterance, if any.
 */
export function parseNumberFromUtterance(utterance: string): number | null {
  const numbers = extractNumbersFromUtterance(utterance);
  return numbers.length > 0 ? numbers[numbers.length - 1] : null;
}
