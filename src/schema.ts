export interface PromiseResult<TData> {
  type: 'error' | 'success';
  data?: TData;
  error?: any;
}

export type ObserverCallback = (value: any) => unknown;

export type Fetcher<TData, TParams extends any[]> = (...args: TParams) => Promise<TData>;

export interface GrootOptions<TData, TParams extends any[], TError> {
  fetcher: Fetcher<TData, TParams>;
  cacheKey: string | ((...args: TParams) => string);
  auto: boolean;
  params?: TParams;
  swr?: boolean;
  errorCallback?: (error: TError) => void;
}

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
