export interface PromiseResult<TData, TError> {
  type: 'error' | 'success';
  data?: TData;
  error?: TError;
}

export type ObserverCallback = (value: any) => unknown;

export type Fetcher<TData, TParams extends any[]> = (...args: TParams) => Promise<TData>;

export enum GrootStatus {
  'init' = 'init',
  'pending' = 'pending',
  'success' = 'success',
  'error' = 'error',
}

export interface GrootResponse<TData, TParams> {
  status: GrootStatus;
  data?: TData;
  req: (params?: TParams) => {};
}
export interface GrootFetcherManagerOptions {
  cacheSize: number;
}
