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
  壹: 1,
  幺: 1,
  二: 2,
  两: 2,
  倆: 2,
  貳: 2,
  三: 3,
  參: 3,
  叁: 3,
  四: 4,
  肆: 4,
  五: 5,
  伍: 5,
  六: 6,
  陸: 6,
  七: 7,
  柒: 7,
  八: 8,
  捌: 8,
  九: 9,
  玖: 9,
};

const CHINESE_SPECIAL_TENS: Record<string, number> = {
  廿: 20,
  卅: 30,
  卌: 40,
};

const PINYIN_DIGITS: Record<string, number> = {
  ling: 0,
  yi: 1,
  yao: 1,
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

const PINYIN_TENS: Record<string, number> = {
  ershi: 20,
  sanshi: 30,
  sishi: 40,
  wushi: 50,
  liushi: 60,
  qishi: 70,
  bashi: 80,
  jiushi: 90,
};

/**
 * Extracts numbers represented by Chinese characters (Hanzi) in text.
 */
function extractChineseNumbersFromText(text: string): number[] {
  const found: number[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];

    const isDigit = CHINESE_DIGITS[char] !== undefined;
    const isTenUnit = char === '十' || char === '拾';
    const isSpecialTen = CHINESE_SPECIAL_TENS[char] !== undefined;
    const isHundred = char === '百' || char === '佰';

    if (!isDigit && !isTenUnit && !isSpecialTen && !isHundred) {
      i++;
      continue;
    }

    // Pattern: digit1 + digit2 + 十/拾 + digit3 where digit1 * digit2 = 10 + digit3
    // (Handles multiplication formulas with teens products, e.g. 二六十二 -> 2, 6, 12; 三五十五 -> 3, 5, 15)
    if (
      isDigit &&
      i + 3 < text.length &&
      CHINESE_DIGITS[text[i + 1]] !== undefined &&
      (text[i + 2] === '十' || text[i + 2] === '拾') &&
      CHINESE_DIGITS[text[i + 3]] !== undefined
    ) {
      const d1 = CHINESE_DIGITS[char];
      const d2 = CHINESE_DIGITS[text[i + 1]];
      const d3 = CHINESE_DIGITS[text[i + 3]];
      if (d1 * d2 === 10 + d3) {
        found.push(d1, d2, 10 + d3);
        i += 4;
        continue;
      }
    }

    // Pattern: digit + 百/佰 + (零)? + (digit + 十 (+ digit) | digit)?
    if (isDigit && i + 1 < text.length && (text[i + 1] === '百' || text[i + 1] === '佰')) {
      let val = CHINESE_DIGITS[char] * 100;
      let len = 2;
      if (
        i + 2 < text.length &&
        text[i + 2] === '零' &&
        i + 3 < text.length &&
        CHINESE_DIGITS[text[i + 3]] !== undefined
      ) {
        val += CHINESE_DIGITS[text[i + 3]];
        len = 4;
      } else if (i + 2 < text.length && CHINESE_DIGITS[text[i + 2]] !== undefined) {
        if (i + 3 < text.length && (text[i + 3] === '十' || text[i + 3] === '拾')) {
          let tens = CHINESE_DIGITS[text[i + 2]] * 10;
          len = 4;
          if (i + 4 < text.length && CHINESE_DIGITS[text[i + 4]] !== undefined) {
            tens += CHINESE_DIGITS[text[i + 4]];
            len = 5;
          }
          val += tens;
        } else {
          val += CHINESE_DIGITS[text[i + 2]] * 10;
          len = 3;
        }
      }
      found.push(val);
      i += len;
      continue;
    }

    // Pattern: digit + 十/拾 + digit (e.g. 四十二 -> 42)
    if (
      isDigit &&
      i + 2 < text.length &&
      (text[i + 1] === '十' || text[i + 1] === '拾') &&
      CHINESE_DIGITS[text[i + 2]] !== undefined
    ) {
      found.push(CHINESE_DIGITS[char] * 10 + CHINESE_DIGITS[text[i + 2]]);
      i += 3;
      continue;
    }

    // Pattern: digit + 十/拾 (e.g. 二十 -> 20)
    if (isDigit && i + 1 < text.length && (text[i + 1] === '十' || text[i + 1] === '拾')) {
      found.push(CHINESE_DIGITS[char] * 10);
      i += 2;
      continue;
    }

    // Pattern: 一十/壹拾 + digit (e.g. 一十一 -> 11)
    if (
      (char === '一' || char === '壹') &&
      i + 2 < text.length &&
      (text[i + 1] === '十' || text[i + 1] === '拾') &&
      CHINESE_DIGITS[text[i + 2]] !== undefined
    ) {
      found.push(10 + CHINESE_DIGITS[text[i + 2]]);
      i += 3;
      continue;
    }

    // Pattern: 十/拾 + digit (e.g. 十一 -> 11)
    if (isTenUnit && i + 1 < text.length && CHINESE_DIGITS[text[i + 1]] !== undefined) {
      found.push(10 + CHINESE_DIGITS[text[i + 1]]);
      i += 2;
      continue;
    }

    // Pattern: 十/拾 alone -> 10
    if (isTenUnit) {
      found.push(10);
      i += 1;
      continue;
    }

    // Pattern: Special tens (廿, 卅, 卌) + digit (e.g. 廿一 -> 21)
    if (isSpecialTen && i + 1 < text.length && CHINESE_DIGITS[text[i + 1]] !== undefined) {
      found.push(CHINESE_SPECIAL_TENS[char] + CHINESE_DIGITS[text[i + 1]]);
      i += 2;
      continue;
    }

    // Pattern: Special tens alone (廿, 卅, 卌) -> 20, 30, 40
    if (isSpecialTen) {
      found.push(CHINESE_SPECIAL_TENS[char]);
      i += 1;
      continue;
    }

    // Pattern: Single digit
    if (isDigit) {
      found.push(CHINESE_DIGITS[char]);
      i += 1;
      continue;
    }

    i++;
  }
  return found;
}

/**
 * Extracts all numbers mentioned in an utterance.
 * Handles digits ("24"), homophones ("for", "ate", "to"), compound words ("forty two", "forty-two"),
 * single words ("twelve", "81"), Chinese number characters ("三十六", "八十一"),
 * and pinyin ("san shi liu", "ba shi yi").
 * Returns an array of numbers in order of appearance.
 */
export function extractNumbersFromUtterance(utterance: string): number[] {
  if (!utterance) return [];

  // 1. Extract numbers written in Chinese characters
  const chineseNumbers = extractChineseNumbersFromText(utterance);

  // 2. Extract digits, English words, homophones, and pinyin tokens
  const normalized = utterance
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .trim();

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const tokenNumbers: number[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Direct digit tokens (e.g. "42", "6", "18")
    if (/^\d+$/.test(token)) {
      tokenNumbers.push(parseInt(token, 10));
      i++;
      continue;
    }

    // Check English compound tens + ones (e.g. "forty two", "twenty-four")
    if (TENS_NUMBERS[token] !== undefined) {
      if (i + 1 < tokens.length && SMALL_NUMBERS[tokens[i + 1]] !== undefined) {
        tokenNumbers.push(TENS_NUMBERS[token] + SMALL_NUMBERS[tokens[i + 1]]);
        i += 2;
        continue;
      }
      tokenNumbers.push(TENS_NUMBERS[token]);
      i++;
      continue;
    }

    // Check English small numbers / teens / homophones (e.g. "sixteen", "eight", "for" -> 4)
    if (SMALL_NUMBERS[token] !== undefined) {
      tokenNumbers.push(SMALL_NUMBERS[token]);
      i++;
      continue;
    }

    // Check Pinyin compound tens (e.g. "bashi", "sanshi")
    if (PINYIN_TENS[token] !== undefined) {
      if (i + 1 < tokens.length && PINYIN_DIGITS[tokens[i + 1]] !== undefined) {
        tokenNumbers.push(PINYIN_TENS[token] + PINYIN_DIGITS[tokens[i + 1]]);
        i += 2;
        continue;
      }
      tokenNumbers.push(PINYIN_TENS[token]);
      i++;
      continue;
    }

    // Check Pinyin digit + "shi" (+ digit) (e.g. "ba shi yi" -> 81, "san shi" -> 30)
    if (
      PINYIN_DIGITS[token] !== undefined &&
      i + 1 < tokens.length &&
      tokens[i + 1] === 'shi'
    ) {
      const tensVal = PINYIN_DIGITS[token] * 10;
      if (i + 2 < tokens.length && PINYIN_DIGITS[tokens[i + 2]] !== undefined) {
        tokenNumbers.push(tensVal + PINYIN_DIGITS[tokens[i + 2]]);
        i += 3;
        continue;
      }
      tokenNumbers.push(tensVal);
      i += 2;
      continue;
    }

    // Check Pinyin "shi" + digit (e.g. "shi wu" -> 15)
    if (
      token === 'shi' &&
      i + 1 < tokens.length &&
      PINYIN_DIGITS[tokens[i + 1]] !== undefined
    ) {
      tokenNumbers.push(10 + PINYIN_DIGITS[tokens[i + 1]]);
      i += 2;
      continue;
    }

    // Check Pinyin standalone digit (e.g. "san" -> 3, "liang" -> 2, "ba" -> 8)
    if (PINYIN_DIGITS[token] !== undefined) {
      tokenNumbers.push(PINYIN_DIGITS[token]);
      i++;
      continue;
    }

    i++;
  }

  return [...chineseNumbers, ...tokenNumbers];
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
