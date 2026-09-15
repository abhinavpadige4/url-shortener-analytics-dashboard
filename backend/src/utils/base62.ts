const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BASE = CHARSET.length;

/**
 * Encodes a number to base62 string
 */
export function encode(num: number): string {
  let encoded = '';
  
  do {
    const remainder = num % BASE;
    encoded = CHARSET.charAt(remainder) + encoded;
    num = Math.floor(num / BASE);
  } while (num > 0);
  
  return encoded;
}

/**
 * Decodes a base62 string to number
 */
export function decode(str: string): number {
  let decoded = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    const index = CHARSET.indexOf(char);
    
    if (index === -1) {
      throw new Error(`Invalid base62 character: ${char}`);
    }
    
    decoded = decoded * BASE + index;
  }
  
  return decoded;
}

/**
 * Generates a random base62 string of specified length
 */
export function generateRandomString(length: number): string {
  let result = '';
  const charsLength = CHARSET.length;
  
  for (let i = 0; i < length; i++) {
    result += CHARSET.charAt(Math.floor(Math.random() * charsLength));
  }
  
  return result;
}

export default { encode, decode, generateRandomString };