import { loadPolicy as opaPolicyLoader } from '@open-policy-agent/opa-wasm';
import { readFile } from '../commons/utils';

export interface IOpaPolicy<T = any, R = any> {
  evaluate(input: T): Promise<R>;
}

interface IOpaLoadedPolicy<T = any, R = any> {
  evaluate(input: T, entrypoint?: string | number | undefined): [{ result: R }]
  setData(data: Record<string, any>): void;
}

type OpaPolicyWasm = BufferSource | WebAssembly.Module;

type OpaPolicyLoader = (regoWasm: OpaPolicyWasm, memoryDescriptor?: number | WebAssembly.MemoryDescriptor | undefined, customBuiltins?: { [builtinName: string]: Function; } | undefined) => Promise<IOpaLoadedPolicy>;

export class OpaPolicy<T = any, R = any> {
  protected readonly _loader: OpaPolicyLoader;

  protected readonly _policyWasm: OpaPolicyWasm;

  protected _policy: IOpaLoadedPolicy | null = null;

  protected _policyData: Record<string, any> | undefined;

  constructor(policyWasm: OpaPolicyWasm, policyData?: Record<string, any>, loader?: OpaPolicyLoader) {
    this._loader = loader || opaPolicyLoader;
    this._policyWasm = policyWasm;
    this._policyData = policyData;
  }

  public readonly evaluate = async (input: T): Promise<R> => {
    if (!this._policy)
      await this.__load();
    const response = this._policy?.evaluate(input) ?? [{ result: null }];
    return response[0]?.result;
  };

  private readonly __load = async (): Promise<void> => {
    this._policy = await this._loader(this._policyWasm);

    if (this._policyData)
      await this._policy.setData(this._policyData);
  };

  public static readonly fromWasmFile = async (policyPath: string, policyData?: Record<string, any>): Promise<OpaPolicy> => {
    const policyWasm = await readFile(policyPath);
    return new OpaPolicy(policyWasm, policyData);
  };
}
