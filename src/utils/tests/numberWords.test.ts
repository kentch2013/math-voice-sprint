import { describe, it, expect } from 'vitest';
import {
  extractNumbersFromUtterance,
  checkUtteranceMatchesAnswer,
  parseNumberFromUtterance,
  mergeTokens,
} from '../numberWords';

describe('numberWords utility', () => {
  describe('extractNumbersFromUtterance', () => {
    it('extracts direct digit tokens', () => {
      expect(extractNumbersFromUtterance('21')).toEqual([21]);
      expect(extractNumbersFromUtterance('The answer is 42')).toEqual([42]);
      expect(extractNumbersFromUtterance('81')).toEqual([81]);
    });

    it('extracts hyphenated compound numbers', () => {
      expect(extractNumbersFromUtterance('twenty-one')).toEqual([21]);
      expect(extractNumbersFromUtterance('thirty-five')).toEqual([35]);
      expect(extractNumbersFromUtterance('forty-two')).toEqual([42]);
      expect(extractNumbersFromUtterance('fifty-six')).toEqual([56]);
      expect(extractNumbersFromUtterance('seventy-two')).toEqual([72]);
    });

    it('extracts space-separated compound numbers', () => {
      expect(extractNumbersFromUtterance('twenty one')).toEqual([21]);
      expect(extractNumbersFromUtterance('thirty five')).toEqual([35]);
      expect(extractNumbersFromUtterance('forty two')).toEqual([42]);
      expect(extractNumbersFromUtterance('fourty two')).toEqual([42]);
      expect(extractNumbersFromUtterance('sixty three')).toEqual([63]);
      expect(extractNumbersFromUtterance('eighty one')).toEqual([81]);
    });

    it('extracts homophones correctly', () => {
      // won -> 1
      expect(extractNumbersFromUtterance('won')).toEqual([1]);
      expect(extractNumbersFromUtterance('twenty won')).toEqual([21]);
      expect(extractNumbersFromUtterance('eighty won')).toEqual([81]);

      // to/too -> 2
      expect(extractNumbersFromUtterance('to')).toEqual([2]);
      expect(extractNumbersFromUtterance('too')).toEqual([2]);
      expect(extractNumbersFromUtterance('thirty to')).toEqual([32]);
      expect(extractNumbersFromUtterance('forty too')).toEqual([42]);

      // for/fore -> 4
      expect(extractNumbersFromUtterance('for')).toEqual([4]);
      expect(extractNumbersFromUtterance('fore')).toEqual([4]);
      expect(extractNumbersFromUtterance('twenty for')).toEqual([24]);
      expect(extractNumbersFromUtterance('fifty fore')).toEqual([54]);

      // ate -> 8
      expect(extractNumbersFromUtterance('ate')).toEqual([8]);
      expect(extractNumbersFromUtterance('twenty ate')).toEqual([28]);
      expect(extractNumbersFromUtterance('forty ate')).toEqual([48]);
    });

    it('handles tens with digits ("twenty 1", "20 1")', () => {
      expect(extractNumbersFromUtterance('twenty 1')).toEqual([21]);
      expect(extractNumbersFromUtterance('30 5')).toEqual([35]);
      expect(extractNumbersFromUtterance('20 1')).toEqual([21]);
      expect(extractNumbersFromUtterance('40 two')).toEqual([42]);
    });
  });

  describe('checkUtteranceMatchesAnswer', () => {
    it('verifies defect reproduction case: 3 x 7 = 21', () => {
      const expectedAnswer = 21;
      expect(checkUtteranceMatchesAnswer('twenty-one', expectedAnswer)).toBe(true);
      expect(checkUtteranceMatchesAnswer('twenty one', expectedAnswer)).toBe(true);
      expect(checkUtteranceMatchesAnswer('twenty won', expectedAnswer)).toBe(true);
      expect(checkUtteranceMatchesAnswer('21', expectedAnswer)).toBe(true);
      expect(checkUtteranceMatchesAnswer('twenty', expectedAnswer)).toBe(false);
      expect(checkUtteranceMatchesAnswer('one', expectedAnswer)).toBe(false);
    });

    it('verifies ALL multiplication products from 2 x 2 through 9 x 9', () => {
      const multiplicationProducts: { a: number; b: number; expected: number; word: string }[] = [
        { a: 2, b: 2, expected: 4, word: 'four' },
        { a: 2, b: 3, expected: 6, word: 'six' },
        { a: 2, b: 4, expected: 8, word: 'eight' },
        { a: 2, b: 5, expected: 10, word: 'ten' },
        { a: 2, b: 6, expected: 12, word: 'twelve' },
        { a: 2, b: 7, expected: 14, word: 'fourteen' },
        { a: 2, b: 8, expected: 16, word: 'sixteen' },
        { a: 2, b: 9, expected: 18, word: 'eighteen' },
        { a: 3, b: 3, expected: 9, word: 'nine' },
        { a: 3, b: 4, expected: 12, word: 'twelve' },
        { a: 3, b: 5, expected: 15, word: 'fifteen' },
        { a: 3, b: 6, expected: 18, word: 'eighteen' },
        { a: 3, b: 7, expected: 21, word: 'twenty-one' },
        { a: 3, b: 8, expected: 24, word: 'twenty-four' },
        { a: 3, b: 9, expected: 27, word: 'twenty-seven' },
        { a: 4, b: 4, expected: 16, word: 'sixteen' },
        { a: 4, b: 5, expected: 20, word: 'twenty' },
        { a: 4, b: 6, expected: 24, word: 'twenty-four' },
        { a: 4, b: 7, expected: 28, word: 'twenty-eight' },
        { a: 4, b: 8, expected: 32, word: 'thirty-two' },
        { a: 4, b: 9, expected: 36, word: 'thirty-six' },
        { a: 5, b: 5, expected: 25, word: 'twenty-five' },
        { a: 5, b: 6, expected: 30, word: 'thirty' },
        { a: 5, b: 7, expected: 35, word: 'thirty-five' },
        { a: 5, b: 8, expected: 40, word: 'forty' },
        { a: 5, b: 9, expected: 45, word: 'forty-five' },
        { a: 6, b: 6, expected: 36, word: 'thirty-six' },
        { a: 6, b: 7, expected: 42, word: 'forty-two' },
        { a: 6, b: 8, expected: 48, word: 'forty-eight' },
        { a: 6, b: 9, expected: 54, word: 'fifty-four' },
        { a: 7, b: 7, expected: 49, word: 'forty-nine' },
        { a: 7, b: 8, expected: 56, word: 'fifty-six' },
        { a: 7, b: 9, expected: 63, word: 'sixty-three' },
        { a: 8, b: 8, expected: 64, word: 'sixty-four' },
        { a: 8, b: 9, expected: 72, word: 'seventy-two' },
        { a: 9, b: 9, expected: 81, word: 'eighty-one' },
      ];

      for (const item of multiplicationProducts) {
        // Digit match
        expect(
          checkUtteranceMatchesAnswer(String(item.expected), item.expected),
          `Failed for digit ${item.expected} (${item.a}x${item.b})`
        ).toBe(true);

        // Word match (hyphenated or single word)
        expect(
          checkUtteranceMatchesAnswer(item.word, item.expected),
          `Failed for word "${item.word}" (${item.expected})`
        ).toBe(true);

        // Word match without hyphen
        const spaceWord = item.word.replace('-', ' ');
        expect(
          checkUtteranceMatchesAnswer(spaceWord, item.expected),
          `Failed for space word "${spaceWord}" (${item.expected})`
        ).toBe(true);
      }
    });
  });

  describe('mergeTokens streaming aggregation', () => {
    it('aggregates split interim tokens ("twenty" followed by "one")', () => {
      let tokens: string[] = [];

      // Token 1: "twenty"
      tokens = mergeTokens(tokens, ['twenty']);
      expect(tokens).toEqual(['twenty']);
      expect(checkUtteranceMatchesAnswer(tokens.join(' '), 21)).toBe(false);

      // Token 2: "one"
      tokens = mergeTokens(tokens, ['one']);
      expect(tokens).toEqual(['twenty', 'one']);
      expect(checkUtteranceMatchesAnswer(tokens.join(' '), 21)).toBe(true);
    });

    it('aggregates cumulative interim tokens ("twenty" then "twenty", "one")', () => {
      let tokens: string[] = [];

      tokens = mergeTokens(tokens, ['twenty']);
      expect(tokens).toEqual(['twenty']);

      tokens = mergeTokens(tokens, ['twenty', 'one']);
      expect(tokens).toEqual(['twenty', 'one']);
      expect(checkUtteranceMatchesAnswer(tokens.join(' '), 21)).toBe(true);
    });

    it('aggregates split interim tokens for 5 x 7 = 35 ("thirty" then "five")', () => {
      let tokens: string[] = [];

      tokens = mergeTokens(tokens, ['thirty']);
      expect(checkUtteranceMatchesAnswer(tokens.join(' '), 35)).toBe(false);

      tokens = mergeTokens(tokens, ['five']);
      expect(tokens).toEqual(['thirty', 'five']);
      expect(checkUtteranceMatchesAnswer(tokens.join(' '), 35)).toBe(true);
    });
  });

  describe('parseNumberFromUtterance legacy helper', () => {
    it('returns the last extracted number', () => {
      expect(parseNumberFromUtterance('twenty one')).toBe(21);
      expect(parseNumberFromUtterance('I think it is 42')).toBe(42);
      expect(parseNumberFromUtterance('no numbers here')).toBeNull();
    });
  });
});
