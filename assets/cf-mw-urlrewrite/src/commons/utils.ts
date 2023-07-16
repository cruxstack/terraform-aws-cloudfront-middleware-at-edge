import { readFile as fsReadFile } from 'fs';

const B64_URLSAFE_MAP = {
  decode: {
    '-': '+',
    _: '/',
    '.': '=',
  },
  encode: {
    '+': '-',
    '/': '_',
    '=': '.',
  },
};

export const sleep = async (time: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export const readFile = async (path: string): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    fsReadFile(path, (err, data) => !err ? resolve(data) : reject(err));
  });
};

export const encodeBase64 = (data: string | Buffer): string => {
  return Buffer.from(data).toString('base64');
};

export const decodeBase64 = (data: string, encoding?: BufferEncoding): string => {
  return Buffer.from(data, 'base64').toString(encoding);
};

export const stringifyUrlSafeBase64 = (data: string, trimPadding?: boolean): string => {
  data = trimPadding ? data.replace(/=/, '') : data;
  // @ts-expect-error
  return data.replace(/[+/=]/g, (m) => B64_URLSAFE_MAP.encode[m]);
};

export const parseUrlSafeBase64 = (data: string) => {
  // @ts-expect-error
  return data.replace(/[-_.]/g, (m) => B64_URLSAFE_MAP.decode[m]);
};

export const isBase64 = (data: string): boolean => {
  return /^[A-Za-z0-9+/]*[=]{0,2}$/.test(data);
};

export const isUrlSafeBase64 = (data: string): boolean => {
  return /^[A-Za-z0-9_-]*[.]{0,2}$/.test(data);
};

export const clone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
