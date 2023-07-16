export interface ICrypter {
  encrypt(data: string, context?: Record<string, string>): Promise<string | undefined>;
  decrypt(data: string, context?: Record<string, string>): Promise<string | undefined>;
  generate(length?: number): string;
  hash(data: string): string;
}
