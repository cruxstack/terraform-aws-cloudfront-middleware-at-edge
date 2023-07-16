import { DecryptCommand, DecryptCommandInput, DecryptCommandOutput, EncryptCommand, EncryptCommandInput, EncryptCommandOutput, KMSClient } from '@aws-sdk/client-kms';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { AwsCrypter } from './aws-crypter';
import { ICrypter } from './types';
import { isBase64 } from '../commons/utils';

describe('AwsCrypter serivce', () => {
  let mockKeyId = 'FAKE_KEY';

  let mockKmsDecryptInput: DecryptCommandInput;

  let mockKmsDecryptOutput: DecryptCommandOutput;

  let mockKmsEncryptInput: EncryptCommandInput;

  let mockKmsEncryptOutput: EncryptCommandOutput;

  beforeEach(() => {
    mockKmsDecryptInput = {
      CiphertextBlob: Buffer.from('test', 'base64'),
      EncryptionContext: {},
      KeyId: mockKeyId,
    };

    mockKmsDecryptOutput = {
      $metadata: {},
      KeyId: mockKeyId,
      Plaintext: Buffer.from('test'),
    };

    mockKmsEncryptInput = {
      KeyId: mockKeyId,
      Plaintext: Buffer.from('test'),
      EncryptionContext: {},
    };

    mockKmsEncryptOutput = {
      $metadata: {},
      CiphertextBlob: Buffer.from('test'),
      EncryptionAlgorithm: 'test',
      KeyId: mockKeyId,
    };
  });

  it('should call kms encrypt command', async () => {
    const mockKms = mockClient(KMSClient);
    mockKms.on(EncryptCommand).resolves(mockKmsEncryptOutput);
    const crypter = new AwsCrypter(mockKeyId, mockKms as any);

    const encrypted = await crypter.encrypt('test', {});

    expect(mockKms).toHaveReceivedCommandTimes(EncryptCommand, 1);
    expect(mockKms).toHaveReceivedCommandWith(EncryptCommand, mockKmsEncryptInput);
    expect(encrypted).toBe('test');
  });

  it('should call kms decrypt command', async () => {
    const mockKms = mockClient(KMSClient);
    mockKms.on(DecryptCommand).resolves(mockKmsDecryptOutput);
    const crypter = new AwsCrypter(mockKeyId, mockKms as any);

    const encrypted = await crypter.decrypt('test', {});

    expect(mockKms).toHaveReceivedCommandTimes(DecryptCommand, 1);
    expect(mockKms).toHaveReceivedCommandWith(DecryptCommand, mockKmsDecryptInput);
    expect(encrypted).toBe('test');
  });

  it('should hash data', async () => {
    const phrase = "Roses are red, violets are blue, I'm a cryptographer, and so am I";
    const crypter = new AwsCrypter(mockKeyId);

    const hash = crypter.hash(phrase);

    expect(hash).toBeDefined();
    expect(hash).toBe('kbwSPiqk6VFkP9gjbnMrY2tlyYXLL8BwcuSEx/ie/LY=');
  });

  it('should hash data in based64 encoding', async () => {
    const crypter = new AwsCrypter(mockKeyId);

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
