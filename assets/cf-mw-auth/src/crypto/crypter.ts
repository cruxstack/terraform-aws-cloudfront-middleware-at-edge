import { createCipheriv, createDecipheriv, createHash, randomInt } from 'crypto';
import type { ICrypter } from './types';

export class Crypter implements ICrypter {
  private readonly _key: string;

  private readonly _ivLength: number = 16;

  private readonly _defaultIvContext: Record<string, string>;

  constructor(key?: string) {
    this._key = key || this.generate(32);
    this._defaultIvContext = { placeholder: 'default-context' };
  }

  public encrypt = async (input: string, context?: Record<string, string | undefined>): Promise<string | undefined> => {
    const iv = this.__generateIv(context || this._defaultIvContext);
    const cipher = createCipheriv('aes-256-ctr', this._key, iv);
    const encrypted = cipher.update(input, 'utf8', 'base64');
    const result = encrypted + cipher.final('base64');
    return result;
  };

  public decrypt = async (input: string, context?: Record<string, string | undefined>): Promise<string | undefined> => {
    const iv = this.__generateIv(context || this._defaultIvContext);
    const decipher = createDecipheriv('aes-256-ctr', this._key, iv);
    const decrypted = decipher.update(input, 'base64', 'utf8');
    const result = decrypted + decipher.final('utf8');
    return result;
  };

  public hash = (data: string): string => {
    return createHash('sha256').update(data, 'utf8').digest('base64');
  };

  public generate = (length?: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    return [...new Array(length)]
      .map(() => chars[randomInt(0, chars.length)])
      .join('');
  };

  private __generateIv = (context: Record<string, string | undefined>): string => {
    return this.hash(JSON.stringify(context)).split('', this._ivLength).join('').padEnd(this._ivLength, '0');
  };
}
