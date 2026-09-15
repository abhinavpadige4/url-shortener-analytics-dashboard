import { describe, test, expect } from '@jest/globals';
import { encode, decode, generateRandomString } from '../src/utils/base62';

describe('Base62 Utility', () => {
  test('should encode and decode numbers correctly', () => {
    const testNumbers = [0, 1, 10, 61, 62, 100, 1000, 12345];
    
    testNumbers.forEach(num => {
      const encoded = encode(num);
      const decoded = decode(encoded);
      expect(decoded).toBe(num);
    });
  });

  test('should generate random strings of specified length', () => {
    const lengths = [5, 10, 15];
    
    lengths.forEach(length => {
      const str = generateRandomString(length);
      expect(str).toHaveLength(length);
      // Check that all characters are valid base62
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      for (let i = 0; i < str.length; i++) {
        expect(charset.includes(str[i])).toBe(true);
      }
    });
  });
});