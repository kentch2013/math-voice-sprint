import { describe, it, expect } from 'vitest';
import {
  extractNumbersFromUtterance,
  checkUtteranceMatchesAnswer,
  parseNumberFromUtterance,
} from '../numberWords';

describe('numberWords', () => {
  describe('extractNumbersFromUtterance', () => {
    it('returns empty array for empty string', () => {
      expect(extractNumbersFromUtterance('')).toEqual([]);
    });

    it('extracts direct digit strings', () => {
      expect(extractNumbersFromUtterance('30')).toEqual([30]);
      expect(extractNumbersFromUtterance('6 times 5 is 30')).toEqual([6, 5, 30]);
    });

    it('extracts word representation of small numbers and homophones', () => {
      expect(extractNumbersFromUtterance('three')).toEqual([3]);
      expect(extractNumbersFromUtterance('for')).toEqual([4]);
      expect(extractNumbersFromUtterance('ate')).toEqual([8]);
      expect(extractNumbersFromUtterance('to')).toEqual([2]);
    });

    it('extracts tens and compound numbers', () => {
      expect(extractNumbersFromUtterance('thirty')).toEqual([30]);
      expect(extractNumbersFromUtterance('forty two')).toEqual([42]);
      expect(extractNumbersFromUtterance('twenty-four')).toEqual([24]);
    });

    it('extracts Mandarin Chinese digits and numbers', () => {
      expect(extractNumbersFromUtterance('零')).toEqual([0]);
      expect(extractNumbersFromUtterance('一')).toEqual([1]);
      expect(extractNumbersFromUtterance('二')).toEqual([2]);
      expect(extractNumbersFromUtterance('两')).toEqual([2]);
      expect(extractNumbersFromUtterance('三')).toEqual([3]);
      expect(extractNumbersFromUtterance('四')).toEqual([4]);
      expect(extractNumbersFromUtterance('五')).toEqual([5]);
      expect(extractNumbersFromUtterance('六')).toEqual([6]);
      expect(extractNumbersFromUtterance('七')).toEqual([7]);
      expect(extractNumbersFromUtterance('八')).toEqual([8]);
      expect(extractNumbersFromUtterance('九')).toEqual([9]);
      expect(extractNumbersFromUtterance('十')).toEqual([10]);
    });

    it('extracts Mandarin Chinese tens and compound numbers', () => {
      expect(extractNumbersFromUtterance('十一')).toEqual([11]);
      expect(extractNumbersFromUtterance('十五')).toEqual([15]);
      expect(extractNumbersFromUtterance('十九')).toEqual([19]);
      expect(extractNumbersFromUtterance('二十')).toEqual([20]);
      expect(extractNumbersFromUtterance('二十一')).toEqual([21]);
      expect(extractNumbersFromUtterance('三十六')).toEqual([36]);
      expect(extractNumbersFromUtterance('四十二')).toEqual([42]);
      expect(extractNumbersFromUtterance('五十六')).toEqual([56]);
      expect(extractNumbersFromUtterance('八十一')).toEqual([81]);
      expect(extractNumbersFromUtterance('九十九')).toEqual([99]);
      expect(extractNumbersFromUtterance('廿一')).toEqual([21]);
      expect(extractNumbersFromUtterance('卅五')).toEqual([35]);
      expect(extractNumbersFromUtterance('卌二')).toEqual([42]);
    });

    it('extracts numbers from pinyin representations', () => {
      expect(extractNumbersFromUtterance('ling')).toEqual([0]);
      expect(extractNumbersFromUtterance('san')).toEqual([3]);
      expect(extractNumbersFromUtterance('liang')).toEqual([2]);
      expect(extractNumbersFromUtterance('ba shi yi')).toEqual([81]);
      expect(extractNumbersFromUtterance('san shi liu')).toEqual([36]);
      expect(extractNumbersFromUtterance('bashi yi')).toEqual([81]);
      expect(extractNumbersFromUtterance('er shi si')).toEqual([24]);
    });
  });

  describe('checkUtteranceMatchesAnswer', () => {
    it('returns false for empty utterance', () => {
      expect(checkUtteranceMatchesAnswer('', 30)).toBe(false);
    });

    it('returns true when direct number or word matches', () => {
      expect(checkUtteranceMatchesAnswer('30', 30)).toBe(true);
      expect(checkUtteranceMatchesAnswer('thirty', 30)).toBe(true);
      expect(checkUtteranceMatchesAnswer('30 30 30', 30)).toBe(true);
      expect(checkUtteranceMatchesAnswer('the answer is 30', 30)).toBe(true);
    });

    it('returns false when answer is not present', () => {
      expect(checkUtteranceMatchesAnswer('25', 30)).toBe(false);
      expect(checkUtteranceMatchesAnswer('twenty five', 30)).toBe(false);
    });

    it('returns true for Mandarin Chinese utterances and sentences', () => {
      expect(checkUtteranceMatchesAnswer('三十六', 36)).toBe(true);
      expect(checkUtteranceMatchesAnswer('答案是三十六', 36)).toBe(true);
      expect(checkUtteranceMatchesAnswer('等于五十六', 56)).toBe(true);
      expect(checkUtteranceMatchesAnswer('六乘以七等于四十二', 42)).toBe(true);
      expect(checkUtteranceMatchesAnswer('6乘7是42', 42)).toBe(true);
      expect(checkUtteranceMatchesAnswer('ba shi yi', 81)).toBe(true);
    });

    it('accurately matches all multiplication products from 2x2 through 9x9 in Mandarin Chinese', () => {
      const multiplicationTable = [
        { formula: '二二得四', product: 4 },
        { formula: '二三得六', product: 6 },
        { formula: '二四得八', product: 8 },
        { formula: '二五一十', product: 10 },
        { formula: '二六十二', product: 12 },
        { formula: '二七十四', product: 14 },
        { formula: '二八十六', product: 16 },
        { formula: '二九十八', product: 18 },
        { formula: '三三得九', product: 9 },
        { formula: '三四十二', product: 12 },
        { formula: '三五十五', product: 15 },
        { formula: '三六十八', product: 18 },
        { formula: '三七二十一', product: 21 },
        { formula: '三八二十四', product: 24 },
        { formula: '三九二十七', product: 27 },
        { formula: '四四十六', product: 16 },
        { formula: '四五二十', product: 20 },
        { formula: '四六二十四', product: 24 },
        { formula: '四七二十八', product: 28 },
        { formula: '四八三十二', product: 32 },
        { formula: '四九三十六', product: 36 },
        { formula: '五五二十五', product: 25 },
        { formula: '五六三十', product: 30 },
        { formula: '五七三十五', product: 35 },
        { formula: '五八四十', product: 40 },
        { formula: '五九四十五', product: 45 },
        { formula: '六六三十六', product: 36 },
        { formula: '六七四十二', product: 42 },
        { formula: '六八四十八', product: 48 },
        { formula: '六九五十四', product: 54 },
        { formula: '七七四十九', product: 49 },
        { formula: '七八五十六', product: 56 },
        { formula: '七九六十三', product: 63 },
        { formula: '八八六十四', product: 64 },
        { formula: '八九七十二', product: 72 },
        { formula: '九九八十一', product: 81 },
      ];

      for (const { formula, product } of multiplicationTable) {
        expect(checkUtteranceMatchesAnswer(formula, product)).toBe(true);
      }
    });
  });

  describe('parseNumberFromUtterance', () => {
    it('returns null for empty utterance', () => {
      expect(parseNumberFromUtterance('')).toBeNull();
    });

    it('returns the last extracted number', () => {
      expect(parseNumberFromUtterance('10 20 30')).toBe(30);
      expect(parseNumberFromUtterance('答案是三十六')).toBe(36);
      expect(parseNumberFromUtterance('九九八十一')).toBe(81);
    });
  });
});
