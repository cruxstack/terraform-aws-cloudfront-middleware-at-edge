import { readFile } from '../commons/utils';
import { OpaPolicy } from './opa-policy';

describe('OpaPolicyClass', () => {
  let policyWasm: Buffer;

  beforeAll(async () => {
    policyWasm = await readFile(`${__dirname}/fixtures/sample_policy.wasm`);
  });

  beforeEach(async () => {
  });

  it('should evalute the data and return true', async () => {
    const policy = new OpaPolicy(policyWasm, {});
    let error: unknown;
    let result: unknown;

    try {
      result = await policy.evaluate({ message: 'world' });
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeUndefined();
    expect(result).toEqual(true);
  });

  it('should evaluate empty input and return false', async () => {
    const policy = new OpaPolicy(policyWasm);
    let error: unknown;
    let result: unknown;

    try {
      result = await policy.evaluate({});
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeUndefined();
    expect(result).toEqual(false);
  });

  it('should evaluate undefined input and return false', async () => {
    const policy = new OpaPolicy(policyWasm);
    let error: unknown;
    let result: unknown;

    try {
      result = await policy.evaluate(undefined);
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeUndefined();
    expect(result).toEqual(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
