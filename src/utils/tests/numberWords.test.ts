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
  });

  describe('parseNumberFromUtterance', () => {
    it('returns null for empty utterance', () => {
      expect(parseNumberFromUtterance('')).toBeNull();
    });

    it('returns the last extracted number', () => {
      expect(parseNumberFromUtterance('10 20 30')).toBe(30);
    });
  });
});
