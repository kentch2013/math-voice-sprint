const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
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

// Chinese single digits and basic values
const CHINESE_DIGITS: Record<string, number> = {
  '零': 0, '0': 0,
  '一': 1, '1': 1,
  '二': 2, '两': 2, '2': 2,
  '三': 3, '3': 3,
  '四': 4, '4': 4,
  '五': 5, '5': 5,
  '六': 6, '6': 6,
  '七': 7, '7': 7,
  '八': 8, '8': 8,
  '九': 9, '9': 9,
};

/**
 * Extracts Chinese numbers from a string.
 * Supports single digits, 10-99 (e.g., 十, 十二, 二十, 二十四, 四十二), and 100 (一百).
 */
function extractChineseNumbers(utterance: string): number[] {
  if (!utterance) return [];

  const numbers: number[] = [];
  const len = utterance.length;
  let i = 0;

  while (i < len) {
    const char = utterance[i];

    // Check for "一百" / "100"
    if (utterance.substring(i, i + 2) === '一百') {
      numbers.push(100);
      i += 2;
      continue;
    }

    // Check for "十" (10 or multiplier)
    if (char === '十') {
      // standalone 十 -> 10 or 十X -> 10 + X
      let nextVal = 0;
      let consumed = 1;
      if (i + 1 < len && CHINESE_DIGITS[utterance[i + 1]] !== undefined) {
        nextVal = CHINESE_DIGITS[utterance[i + 1]];
        consumed = 2;
      }
      numbers.push(10 + nextVal);
      i += consumed;
      continue;
    }

    // Check if char is a Chinese digit (一..九, 两, 二, 零)
    if (CHINESE_DIGITS[char] !== undefined) {
      const firstVal = CHINESE_DIGITS[char];

      // Check if followed by "十" e.g., 二十 (20) or 二十四 (24)
      if (i + 1 < len && utterance[i + 1] === '十') {
        let secondVal = 0;
        let consumed = 2;
        if (i + 2 < len && CHINESE_DIGITS[utterance[i + 2]] !== undefined) {
          secondVal = CHINESE_DIGITS[utterance[i + 2]];
          consumed = 3;
        }
        numbers.push(firstVal * 10 + secondVal);
        i += consumed;
        continue;
      }

      numbers.push(firstVal);
      i++;
      continue;
    }

    i++;
  }

  return numbers;
}

/**
 * Extracts all numbers mentioned in an utterance.
 * Handles digits ("24"), homophones ("for", "ate", "to"), compound words ("forty two", "forty-two"),
 * single words ("twelve", "81"), and Chinese number words ("二十四", "四十二", "八").
 * Returns an array of numbers in order of appearance.
 */
export function extractNumbersFromUtterance(utterance: string): number[] {
  if (!utterance) return [];

  const foundNumbers: number[] = [];

  // Extract Chinese numbers if utterance contains Chinese characters
  if (/[\u4e00-\u9fa5]/.test(utterance)) {
    const chineseNums = extractChineseNumbers(utterance);
    foundNumbers.push(...chineseNums);
  }

  const normalized = utterance
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .trim();

  const tokens = normalized.split(/\s+/).filter(Boolean);

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // 1. Direct digit tokens (e.g. "42", "6", "18")
    if (/^\d+$/.test(token)) {
      foundNumbers.push(parseInt(token, 10));
      i++;
      continue;
    }

    // 2. Check compound tens + ones (e.g. "forty two", "twenty-four")
    if (TENS_NUMBERS[token] !== undefined) {
      if (i + 1 < tokens.length && SMALL_NUMBERS[tokens[i + 1]] !== undefined) {
        foundNumbers.push(TENS_NUMBERS[token] + SMALL_NUMBERS[tokens[i + 1]]);
        i += 2;
        continue;
      }
      foundNumbers.push(TENS_NUMBERS[token]);
      i++;
      continue;
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
