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

    it('extracts Mandarin Chinese Hanzi numbers', () => {
      expect(extractNumbersFromUtterance('零')).toEqual([0]);
      expect(extractNumbersFromUtterance('四')).toEqual([4]);
      expect(extractNumbersFromUtterance('八')).toEqual([8]);
      expect(extractNumbersFromUtterance('十')).toEqual([10]);
      expect(extractNumbersFromUtterance('十二')).toEqual([12]);
      expect(extractNumbersFromUtterance('二十')).toEqual([20]);
      expect(extractNumbersFromUtterance('二十四')).toEqual([24]);
      expect(extractNumbersFromUtterance('三十')).toEqual([30]);
      expect(extractNumbersFromUtterance('四十二')).toEqual([42]);
      expect(extractNumbersFromUtterance('八十一')).toEqual([81]);
      expect(extractNumbersFromUtterance('答案是二十四')).toEqual([24]);
      expect(extractNumbersFromUtterance('六乘五等于三十')).toEqual([6, 5, 30]);
    });

    it('extracts Pinyin numbers with and without spaces and tone marks', () => {
      expect(extractNumbersFromUtterance('si')).toEqual([4]);
      expect(extractNumbersFromUtterance('ba')).toEqual([8]);
      expect(extractNumbersFromUtterance('er')).toEqual([2]);
      expect(extractNumbersFromUtterance('liang')).toEqual([2]);
      expect(extractNumbersFromUtterance('shi')).toEqual([10]);
      expect(extractNumbersFromUtterance('shi er')).toEqual([12]);
      expect(extractNumbersFromUtterance('shier')).toEqual([12]);
      expect(extractNumbersFromUtterance('er shi')).toEqual([20]);
      expect(extractNumbersFromUtterance('ershi')).toEqual([20]);
      expect(extractNumbersFromUtterance('er shi si')).toEqual([24]);
      expect(extractNumbersFromUtterance('ershisi')).toEqual([24]);
      expect(extractNumbersFromUtterance('san shi')).toEqual([30]);
      expect(extractNumbersFromUtterance('sanshi')).toEqual([30]);
      expect(extractNumbersFromUtterance('ba shi yi')).toEqual([81]);
      expect(extractNumbersFromUtterance('bashiyi')).toEqual([81]);
      expect(extractNumbersFromUtterance('sì shí èr')).toEqual([42]);
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

    it('returns true for Mandarin Chinese Hanzi and Pinyin utterances', () => {
      expect(checkUtteranceMatchesAnswer('二十四', 24)).toBe(true);
      expect(checkUtteranceMatchesAnswer('答案是二十四', 24)).toBe(true);
      expect(checkUtteranceMatchesAnswer('er shi si', 24)).toBe(true);
      expect(checkUtteranceMatchesAnswer('ershisi', 24)).toBe(true);
      expect(checkUtteranceMatchesAnswer('八十一', 81)).toBe(true);
      expect(checkUtteranceMatchesAnswer('ba shi yi', 81)).toBe(true);
    });

    it('evaluates all multiplication products (2x2 through 9x9) correctly in English and Mandarin', () => {
      const products: Array<{
        product: number;
        english: string[];
        hanzi: string[];
        pinyin: string[];
      }> = [
        { product: 4, english: ['4', 'four', 'for'], hanzi: ['四'], pinyin: ['si', 'sì'] },
        { product: 6, english: ['6', 'six'], hanzi: ['六'], pinyin: ['liu', 'liù'] },
        { product: 8, english: ['8', 'eight', 'ate'], hanzi: ['八'], pinyin: ['ba', 'bā'] },
        { product: 9, english: ['9', 'nine'], hanzi: ['九'], pinyin: ['jiu', 'jiǔ'] },
        { product: 10, english: ['10', 'ten'], hanzi: ['十'], pinyin: ['shi', 'shí'] },
        { product: 12, english: ['12', 'twelve'], hanzi: ['十二'], pinyin: ['shi er', 'shier'] },
        { product: 14, english: ['14', 'fourteen'], hanzi: ['十四'], pinyin: ['shi si', 'shisi'] },
        { product: 15, english: ['15', 'fifteen'], hanzi: ['十五'], pinyin: ['shi wu', 'shiwu'] },
        { product: 16, english: ['16', 'sixteen'], hanzi: ['十六'], pinyin: ['shi liu', 'shiliu'] },
        { product: 18, english: ['18', 'eighteen'], hanzi: ['十八'], pinyin: ['shi ba', 'shiba'] },
        { product: 20, english: ['20', 'twenty'], hanzi: ['二十'], pinyin: ['er shi', 'ershi', 'liang shi'] },
        { product: 21, english: ['21', 'twenty one', 'twenty-one'], hanzi: ['二十一'], pinyin: ['er shi yi', 'ershiyi'] },
        { product: 24, english: ['24', 'twenty four', 'twenty-four'], hanzi: ['二十四'], pinyin: ['er shi si', 'ershisi'] },
        { product: 25, english: ['25', 'twenty five', 'twenty-five'], hanzi: ['二十五'], pinyin: ['er shi wu', 'ershiwu'] },
        { product: 27, english: ['27', 'twenty seven', 'twenty-seven'], hanzi: ['二十七'], pinyin: ['er shi qi', 'ershiqi'] },
        { product: 28, english: ['28', 'twenty eight', 'twenty-eight'], hanzi: ['二十八'], pinyin: ['er shi ba', 'ershiba'] },
        { product: 30, english: ['30', 'thirty'], hanzi: ['三十'], pinyin: ['san shi', 'sanshi'] },
        { product: 32, english: ['32', 'thirty two', 'thirty-two'], hanzi: ['三十二'], pinyin: ['san shi er', 'sanshier'] },
        { product: 35, english: ['35', 'thirty five', 'thirty-five'], hanzi: ['三十五'], pinyin: ['san shi wu', 'sanshiwu'] },
        { product: 36, english: ['36', 'thirty six', 'thirty-six'], hanzi: ['三十六'], pinyin: ['san shi liu', 'sanshiliu'] },
        { product: 40, english: ['40', 'forty'], hanzi: ['四十'], pinyin: ['si shi', 'sishi'] },
        { product: 42, english: ['42', 'forty two', 'forty-two'], hanzi: ['四十二'], pinyin: ['si shi er', 'sishier'] },
        { product: 45, english: ['45', 'forty five', 'forty-five'], hanzi: ['四十五'], pinyin: ['si shi wu', 'sishiwu'] },
        { product: 48, english: ['48', 'forty eight', 'forty-eight'], hanzi: ['四十八'], pinyin: ['si shi ba', 'sishiba'] },
        { product: 49, english: ['49', 'forty nine', 'forty-nine'], hanzi: ['四十九'], pinyin: ['si shi jiu', 'sishijiu'] },
        { product: 54, english: ['54', 'fifty four', 'fifty-four'], hanzi: ['五十四'], pinyin: ['wu shi si', 'wushisi'] },
        { product: 56, english: ['56', 'fifty six', 'fifty-six'], hanzi: ['五十六'], pinyin: ['wu shi liu', 'wushiliu'] },
        { product: 63, english: ['63', 'sixty three', 'sixty-three'], hanzi: ['六十三'], pinyin: ['liu shi san', 'liushisan'] },
        { product: 64, english: ['64', 'sixty four', 'sixty-four'], hanzi: ['六十四'], pinyin: ['liu shi si', 'liushisi'] },
        { product: 72, english: ['72', 'seventy two', 'seventy-two'], hanzi: ['七十二'], pinyin: ['qi shi er', 'qishier'] },
        { product: 81, english: ['81', 'eighty one', 'eighty-one'], hanzi: ['八十一'], pinyin: ['ba shi yi', 'bashiyi'] },
      ];

      for (const item of products) {
        for (const eng of item.english) {
          expect(checkUtteranceMatchesAnswer(eng, item.product)).toBe(true);
        }
        for (const hnz of item.hanzi) {
          expect(checkUtteranceMatchesAnswer(hnz, item.product)).toBe(true);
        }
        for (const pyn of item.pinyin) {
          expect(checkUtteranceMatchesAnswer(pyn, item.product)).toBe(true);
        }
      }
    });
  });

  describe('parseNumberFromUtterance', () => {
    it('returns null for empty utterance', () => {
      expect(parseNumberFromUtterance('')).toBeNull();
    });

    it('returns the last extracted number', () => {
      expect(parseNumberFromUtterance('10 20 30')).toBe(30);
      expect(parseNumberFromUtterance('六 乘 五 等于 三十')).toBe(30);
    });
  });
});
