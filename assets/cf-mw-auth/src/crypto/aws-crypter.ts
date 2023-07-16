import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms';
import { createHash, randomInt } from 'crypto';
import type { DecryptCommandInput, DecryptCommandOutput, EncryptCommandInput, EncryptCommandOutput } from '@aws-sdk/client-kms';
import type { ICrypter } from './types';

export class AwsCrypter implements ICrypter {
  private readonly _client: KMSClient;

  private readonly _keyId: string;

  private readonly _defaultEncryptionContext: Record<string, string>;

  constructor(keyId: string, kmsClient?: KMSClient) {
    this._keyId = keyId;
    this._client = kmsClient || new KMSClient({});
    this._defaultEncryptionContext = { placeholder: 'default-context' };
  }

  public encrypt = async (data: string, context?: Record<string, string>): Promise<string | undefined> => {
    context = context || this._defaultEncryptionContext;
    const input: EncryptCommandInput = {
      KeyId: this._keyId,
      Plaintext: Buffer.from(data),
      EncryptionContext: context,
    };

    const response = await this.__encrypt(input);
    return response.CiphertextBlob?.toString();
  };

  public decrypt = async (data: string, context?: Record<string, string>): Promise<string | undefined> => {
    context = context || this._defaultEncryptionContext;
    const input: DecryptCommandInput = {
      KeyId: this._keyId,
      CiphertextBlob: Buffer.from(data, 'base64'),
      EncryptionContext: context,
    };

    const response = await this.__decrypt(input);
    return response.Plaintext?.toString();
  };

  public hash = (data: string): string => {
    return createHash('sha256').update(data).digest('base64');
  };

  public generate = (length?: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    return [...new Array(length)]
      .map(() => chars[randomInt(0, chars.length)])
      .join('');
  };

  private __encrypt = async (input: EncryptCommandInput): Promise<EncryptCommandOutput> => {
    const command: EncryptCommand = new EncryptCommand(input);
    return this._client.send(command);
  };

  private __decrypt = async (input: DecryptCommandInput): Promise<DecryptCommandOutput> => {
    const command: DecryptCommand = new DecryptCommand(input);
    return this._client.send(command);
  };
}
