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

const CHINESE_DIGIT_MAP: Record<string, number> = {
  '零': 0, '〇': 0,
  '一': 1, '壹': 1,
  '二': 2, '俩': 2, '兩': 2, '两': 2,
  '三': 3, '叁': 3,
  '四': 4, '肆': 4,
  '五': 5, '伍': 5,
  '六': 6, '陆': 6,
  '七': 7, '柒': 7,
  '八': 8, '捌': 8,
  '九': 9, '玖': 9,
};

function normalizeChineseNumbers(text: string): string {
  if (!text) return text;

  // Convert full-width digits (０-９) to ASCII digits (0-9)
  let result = text.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));

  // Handle "一百" / 100
  result = result.replace(/一百/g, ' 100 ');

  // Replace compound Chinese numbers first
  // e.g. "八十一" -> 81, "二十四" -> 24, "十六" -> 16, "二十" -> 20, "十" -> 10
  result = result.replace(/([一二三四五六七八九壹贰叁肆伍陆柒捌玖])十([一二三四五六七八九壹贰叁肆伍陆柒捌玖])/g, (_, tens, ones) => {
    const t = CHINESE_DIGIT_MAP[tens] ?? 0;
    const o = CHINESE_DIGIT_MAP[ones] ?? 0;
    return ` ${(t * 10 + o).toString()} `;
  });

  result = result.replace(/([一二三四五六七八九壹贰叁肆伍陆柒捌玖])十/g, (_, tens) => {
    const t = CHINESE_DIGIT_MAP[tens] ?? 0;
    return ` ${(t * 10).toString()} `;
  });

  result = result.replace(/十([一二三四五六七八九壹贰叁肆伍陆柒捌玖])/g, (_, ones) => {
    const o = CHINESE_DIGIT_MAP[ones] ?? 0;
    return ` ${(10 + o).toString()} `;
  });

  result = result.replace(/十/g, ' 10 ');

  // Replace remaining single Chinese digits e.g. 六 -> 6
  result = result.replace(/[零〇一壹二俩兩两三叁四肆五伍六陆七柒八捌九玖]/g, (ch) => {
    return CHINESE_DIGIT_MAP[ch] !== undefined ? CHINESE_DIGIT_MAP[ch].toString() : ch;
  });

  return result;
}

/**
 * Extracts all numbers mentioned in an utterance.
 * Handles digits ("24"), homophones ("for", "ate", "to"), compound words ("forty two", "forty-two"),
 * Chinese numbers ("六六六", "八十一", "二十四", "四十二"), repeated digits ("666", "66"), concatenated speech runs ("81666"),
 * and single words ("twelve", "81").
 * Returns an array of numbers in order of appearance.
 */
export function extractNumbersFromUtterance(utterance: string): number[] {
  if (!utterance) return [];

  const foundNumbers: number[] = [];

  const normalizedChinese = normalizeChineseNumbers(utterance);

  const normalized = normalizedChinese
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .trim();

  const tokens = normalized.split(/\s+/).filter(Boolean);

  const addNumber = (num: number) => {
    if (!foundNumbers.includes(num)) {
      foundNumbers.push(num);
    }
  };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // 1. Direct digit tokens (e.g. "42", "6", "18", "666", "81666")
    if (/^\d+$/.test(token)) {
      const fullNum = parseInt(token, 10);
      addNumber(fullNum);

      // Check repeated single digits (e.g. "666", "66" -> 6)
      if (/^(\d)\1+$/.test(token)) {
        addNumber(parseInt(token[0], 10));
      }

      // Handle concatenated speech runs (e.g. "81666", "816", "24666")
      if (token.length > 2 && fullNum !== 100) {
        // Pattern A: Repeated digit suffix (e.g., "81666" -> "81" and "666")
        const matchSuffix = token.match(/^(\d+?)(\d)\2+$/);
        if (matchSuffix) {
          addNumber(parseInt(matchSuffix[1], 10));
          addNumber(parseInt(matchSuffix[2], 10));
        }

        // Pattern B: Repeated digit prefix (e.g., "66681" -> "666" and "81")
        const matchPrefix = token.match(/^(\d)\1+(\d+)$/);
        if (matchPrefix) {
          addNumber(parseInt(matchPrefix[1], 10));
          addNumber(parseInt(matchPrefix[2], 10));
        }

        // Pattern C: 2-digit prefix + 1-digit suffix (e.g. "816" -> 81, 6)
        const match2And1 = token.match(/^(\d{2})(\d{1})$/);
        if (match2And1) {
          addNumber(parseInt(match2And1[1], 10));
          addNumber(parseInt(match2And1[2], 10));
        }

        // Pattern D: 1-digit prefix + 2-digit suffix (e.g. "681" -> 6, 81)
        const match1And2 = token.match(/^(\d{1})(\d{2})$/);
        if (match1And2) {
          addNumber(parseInt(match1And2[1], 10));
          addNumber(parseInt(match1And2[2], 10));
        }
      }

      i++;
      continue;
    }

    // 2. Check compound tens + ones (e.g. "forty two", "twenty-four")
    if (TENS_NUMBERS[token] !== undefined) {
      if (i + 1 < tokens.length && SMALL_NUMBERS[tokens[i + 1]] !== undefined) {
        addNumber(TENS_NUMBERS[token] + SMALL_NUMBERS[tokens[i + 1]]);
        i += 2;
        continue;
      }
      addNumber(TENS_NUMBERS[token]);
      i++;
      continue;
    }

    // 3. Small numbers / teens / homophones (e.g. "sixteen", "eight", "for" -> 4)
    if (SMALL_NUMBERS[token] !== undefined) {
      addNumber(SMALL_NUMBERS[token]);
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
