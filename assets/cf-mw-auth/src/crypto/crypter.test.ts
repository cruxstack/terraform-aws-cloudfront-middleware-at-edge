import { Crypter } from './crypter';
import { isBase64 } from '../commons/utils';

describe('Crypter serivce', () => {
  beforeEach(() => { });

  it('should encrypt data', async () => {
    const key = '12345678901234567890123456789012';
    const iv = '1234567890123456';
    const crypter = new Crypter(key);

    const encrypted = await crypter.encrypt('test');

    expect(encrypted).toBeDefined();
    expect(encrypted).toBe('hPQo3w==');
    expect(typeof encrypted).toBe('string');
    expect(isBase64(encrypted as string)).toBeTruthy();
  });

  it('should encrypt data in base64 encoding', async () => {
    const crypter = new Crypter();

    const encrypted00 = await crypter.encrypt('test00');
    const encrypted01 = await crypter.encrypt('test01');
    const encrypted02 = await crypter.encrypt('test02');

    expect(isBase64(encrypted00 as string)).toBeTruthy();
    expect(isBase64(encrypted01 as string)).toBeTruthy();
    expect(isBase64(encrypted02 as string)).toBeTruthy();
  });

  it('should decrypt data', async () => {
    const phrase = "Roses are red, violets are blue, I'm a cryptographer, and so am I";
    const crypter = new Crypter();

    const encrypted = await crypter.encrypt(phrase);
    const decrypted = await crypter.decrypt(encrypted as string);

    expect(decrypted).toBeDefined();
    expect(decrypted).toBe(phrase);
  });

  it('should hash data', async () => {
    const phrase = "Roses are red, violets are blue, I'm a cryptographer, and so am I";
    const crypter = new Crypter();

    const hash = crypter.hash(phrase);

    expect(hash).toBeDefined();
    expect(hash).toBe('kbwSPiqk6VFkP9gjbnMrY2tlyYXLL8BwcuSEx/ie/LY=');
  });

  it('should hash data in based64 encoding', async () => {
    const crypter = new Crypter();

    const hash00 = crypter.hash('test00');
    const hash01 = crypter.hash('test00');
    const hash02 = crypter.hash('test00');

    expect(isBase64(hash00)).toBeTruthy();
    expect(isBase64(hash01)).toBeTruthy();
    expect(isBase64(hash02)).toBeTruthy();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
