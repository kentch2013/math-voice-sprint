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
 * Handles digits ("24"), homophones ("won", "for", "ate", "to"), compound words ("forty two", "forty-two"),
 * single words ("twelve", "81"), and streaming tens + ones.
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

    // 1. Direct digit tokens (e.g. "42", "6", "18") or digit tens + ones ("20 1")
    if (/^\d+$/.test(token)) {
      const val = parseInt(token, 10);
      if (val >= 20 && val <= 90 && val % 10 === 0 && i + 1 < tokens.length) {
        const nextTok = tokens[i + 1];
        if (/^[1-9]$/.test(nextTok)) {
          foundNumbers.push(val + parseInt(nextTok, 10));
          i += 2;
          continue;
        }
        if (SMALL_NUMBERS[nextTok] !== undefined && SMALL_NUMBERS[nextTok] >= 1 && SMALL_NUMBERS[nextTok] <= 9) {
          foundNumbers.push(val + SMALL_NUMBERS[nextTok]);
          i += 2;
          continue;
        }
      }
      foundNumbers.push(val);
      i++;
      continue;
    }

    // 2. Check compound tens + ones (e.g. "forty two", "twenty-four", "twenty 1")
    if (TENS_NUMBERS[token] !== undefined) {
      const tensVal = TENS_NUMBERS[token];
      if (i + 1 < tokens.length) {
        const nextTok = tokens[i + 1];
        if (SMALL_NUMBERS[nextTok] !== undefined && SMALL_NUMBERS[nextTok] >= 1 && SMALL_NUMBERS[nextTok] <= 9) {
          foundNumbers.push(tensVal + SMALL_NUMBERS[nextTok]);
          i += 2;
          continue;
        }
        if (/^[1-9]$/.test(nextTok)) {
          foundNumbers.push(tensVal + parseInt(nextTok, 10));
          i += 2;
          continue;
        }
      }
      foundNumbers.push(tensVal);
      i++;
      continue;
    }

    // 3. Small numbers / teens / homophones (e.g. "sixteen", "eight", "for" -> 4, "won" -> 1)
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
 * Merges two token sequences by identifying overlap between the suffix of existingTokens
 * and the prefix of newTokens.
 */
export function mergeTokens(existingTokens: string[], newTokens: string[]): string[] {
  if (!newTokens.length) return existingTokens;
  if (!existingTokens.length) return newTokens;

  const maxOverlap = Math.min(existingTokens.length, newTokens.length);
  for (let k = maxOverlap; k > 0; k--) {
    const existingSuffix = existingTokens.slice(existingTokens.length - k);
    const newPrefix = newTokens.slice(0, k);
    let match = true;
    for (let i = 0; i < k; i++) {
      if (existingSuffix[i] !== newPrefix[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      return [...existingTokens, ...newTokens.slice(k)];
    }
  }

  return [...existingTokens, ...newTokens];
}

/**
 * Legacy helper maintained for interface compatibility.
 * Returns the most recent/relevant number extracted from utterance, if any.
 */
export function parseNumberFromUtterance(utterance: string): number | null {
  const numbers = extractNumbersFromUtterance(utterance);
  return numbers.length > 0 ? numbers[numbers.length - 1] : null;
}
