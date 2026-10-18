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

const CHINESE_DIGITS: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const PINYIN_DIGITS: Record<string, number> = {
  ling: 0,
  yi: 1,
  er: 2,
  liang: 2,
  san: 3,
  si: 4,
  wu: 5,
  liu: 6,
  qi: 7,
  ba: 8,
  jiu: 9,
};

const JOINED_PINYIN_MAP: Record<string, number> = (() => {
  const map: Record<string, number> = {
    shi: 10,
    shiyi: 11,
    shier: 12,
    shisan: 13,
    shisi: 14,
    shiwu: 15,
    shiliu: 16,
    shiqi: 17,
    shiba: 18,
    shijiu: 19,
  };

  const tensList: Array<[string, number]> = [
    ['er', 20],
    ['liang', 20],
    ['san', 30],
    ['si', 40],
    ['wu', 50],
    ['liu', 60],
    ['qi', 70],
    ['ba', 80],
    ['jiu', 90],
  ];

  const onesList: Array<[string, number]> = [
    ['yi', 1],
    ['er', 2],
    ['san', 3],
    ['si', 4],
    ['wu', 5],
    ['liu', 6],
    ['qi', 7],
    ['ba', 8],
    ['jiu', 9],
  ];

  for (const [tPrefix, tVal] of tensList) {
    map[`${tPrefix}shi`] = tVal;
    for (const [oPrefix, oVal] of onesList) {
      map[`${tPrefix}shi${oPrefix}`] = tVal + oVal;
    }
  }

  for (const [pKey, pVal] of Object.entries(PINYIN_DIGITS)) {
    if (map[pKey] === undefined) {
      map[pKey] = pVal;
    }
  }

  return map;
})();

function parseChineseHanziNumber(str: string): number {
  if (str === '十') return 10;
  if (str.includes('十')) {
    const parts = str.split('十');
    const tensStr = parts[0];
    const onesStr = parts[1];

    const tens = tensStr ? (CHINESE_DIGITS[tensStr] ?? 1) : 1;
    const ones = onesStr ? (CHINESE_DIGITS[onesStr] ?? 0) : 0;
    return tens * 10 + ones;
  }
  return CHINESE_DIGITS[str] ?? 0;
}

interface NumberMatch {
  index: number;
  val: number;
}

/**
 * Extracts all numbers mentioned in an utterance.
 * Handles digits ("24"), homophones ("for", "ate", "to"), compound words ("forty two", "forty-two"),
 * single words ("twelve", "81"), Chinese characters ("二十四", "八十一", "四"), and Pinyin ("er shi si", "bashiyi").
 * Returns an array of numbers in order of appearance.
 */
export function extractNumbersFromUtterance(utterance: string): number[] {
  if (!utterance) return [];

  const matches: NumberMatch[] = [];

  // 1. Extract Chinese Hanzi character numbers
  const CHINESE_NUM_REGEX = /[一二两三四五六七八九]?十[一二两三四五六七八九]?|[零一二两三四五六七八九]/g;
  let chMatch: RegExpExecArray | null;
  while ((chMatch = CHINESE_NUM_REGEX.exec(utterance)) !== null) {
    matches.push({
      index: chMatch.index,
      val: parseChineseHanziNumber(chMatch[0]),
    });
  }

  // 2. Normalize utterance for ASCII / Pinyin token extraction (remove diacritics / tone marks)
  const normalized = utterance
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .trim();

  const rawTokens = normalized.split(/\s+/).filter(Boolean);

  let i = 0;
  while (i < rawTokens.length) {
    const token = rawTokens[i];

    // Direct digits (e.g. "42", "6", "18")
    if (/^\d+$/.test(token)) {
      matches.push({ index: 0, val: parseInt(token, 10) });
      i++;
      continue;
    }

    // English compound tens + ones (e.g. "forty two", "twenty four")
    if (TENS_NUMBERS[token] !== undefined) {
      if (i + 1 < rawTokens.length && SMALL_NUMBERS[rawTokens[i + 1]] !== undefined) {
        matches.push({ index: 0, val: TENS_NUMBERS[token] + SMALL_NUMBERS[rawTokens[i + 1]] });
        i += 2;
        continue;
      }
      matches.push({ index: 0, val: TENS_NUMBERS[token] });
      i++;
      continue;
    }

    // Pinyin spaced compound tens + ones (e.g. "er shi si" -> 24, "ba shi yi" -> 81)
    if (PINYIN_DIGITS[token] !== undefined && PINYIN_DIGITS[token] > 0) {
      if (i + 1 < rawTokens.length && rawTokens[i + 1] === 'shi') {
        const tensVal = PINYIN_DIGITS[token] * 10;
        if (
          i + 2 < rawTokens.length &&
          PINYIN_DIGITS[rawTokens[i + 2]] !== undefined &&
          PINYIN_DIGITS[rawTokens[i + 2]] > 0
        ) {
          matches.push({ index: 0, val: tensVal + PINYIN_DIGITS[rawTokens[i + 2]] });
          i += 3;
          continue;
        }
        matches.push({ index: 0, val: tensVal });
        i += 2;
        continue;
      }
    }

    // Pinyin spaced teens (e.g. "shi si" -> 14, "shi yi" -> 11)
    if (token === 'shi') {
      if (
        i + 1 < rawTokens.length &&
        PINYIN_DIGITS[rawTokens[i + 1]] !== undefined &&
        PINYIN_DIGITS[rawTokens[i + 1]] > 0
      ) {
        matches.push({ index: 0, val: 10 + PINYIN_DIGITS[rawTokens[i + 1]] });
        i += 2;
        continue;
      }
      matches.push({ index: 0, val: 10 });
      i++;
      continue;
    }

    // Joined pinyin (e.g. "bashiyi" -> 81, "ershisi" -> 24, "shisi" -> 14)
    if (JOINED_PINYIN_MAP[token] !== undefined) {
      matches.push({ index: 0, val: JOINED_PINYIN_MAP[token] });
      i++;
      continue;
    }

    // English small numbers / teens / homophones (e.g. "sixteen", "eight", "for" -> 4)
    if (SMALL_NUMBERS[token] !== undefined) {
      matches.push({ index: 0, val: SMALL_NUMBERS[token] });
      i++;
      continue;
    }

    i++;
  }

  return matches.map((m) => m.val);
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
