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
  'refreshing' = 'refreshing',
}

export interface GrootFetcherManagerOptions {
  cacheSize: number;
}

export interface GrootPromiseResponse<TData> {
  data?: TData;
  success: boolean;
}
