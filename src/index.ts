import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidV4 } from 'uuid';
import {
  GlobalFetcherCounter,
  GlobalFetcherKeyManager,
  GlobalFetcherManager,
  GrootFetcherManager,
} from './fetcher';
import { Fetcher, GrootStatus, PromiseResult } from './schema';
import stringify from 'json-stable-stringify';

export { GrootStatus } from './schema';

export interface GrootOptions<TData, TParams extends any[], TError> {
  fetcher: Fetcher<TData, TParams>;
  cacheKey?: string | ((...args: TParams) => string);
  auto: boolean;
  params?: TParams;
  swr?: boolean;
  errorCallback?: (error: TError) => void;
  fetcherManager?: GrootFetcherManager;
}

export interface GrootResponse<TData, TParams extends any[], TError> {
  data: TData | undefined;
  error: TError | undefined;
  status: GrootStatus;
  req: (...params: TParams | []) => void;
  refresh: (...params: TParams | []) => void;
}

const useRefState = <T>(initValue: T): [T, { current: T }, (value: T) => void] => {
  const [value, setValue] = useState(initValue);
  const valueRef = useRef(value);
  const updateValue = (nextValue: T) => {
    setValue(nextValue);
    valueRef.current = nextValue;
  };
  return [value, valueRef, updateValue];
};

export function useGroot<TData, TParams extends any[], TError = any>(
  options: GrootOptions<TData, TParams, TError>,
): GrootResponse<TData, TParams, TError> {
  // For stability reasons, users are not expected to change the fetcherManager
  const [fetcherManager] = useState(options.fetcherManager || GlobalFetcherManager);
  const [error, setError] = useState<TError | undefined>(undefined);
  const [data, dataRef, updateData] = useRefState<TData | undefined>(undefined);
  const [status, setStatus] = useState<GrootStatus>(GrootStatus.init);
  const [uuid] = useState(uuidV4());
  const [_currentParams, currentParamsRef, updateCurrentParams] = useRefState(options.params);
  const [currentCacheKey, setCurrentCacheKey] = useState<string | null>(null);

  const reqImpl = useCallback(
    (params?: TParams, refresh?: boolean) => {
      const count = GlobalFetcherCounter.increase(uuid);

      const usingParams = params || currentParamsRef.current || ([] as unknown[] as TParams);
      const usingCacheKey =
        'cacheKey' in options
          ? typeof options.cacheKey == 'function'
            ? options.cacheKey(...usingParams)
            : (options.cacheKey as string)
          : `${GlobalFetcherKeyManager.getId(options.fetcher)}_${stringify(usingParams)}`;

      if (!options.swr) {
        updateData(undefined);
      }
      setStatus(refresh ? GrootStatus.refreshing : GrootStatus.pending);
      updateCurrentParams(usingParams);
      setCurrentCacheKey(usingCacheKey);

      fetcherManager.fetch(
        usingCacheKey,
        options.fetcher,
        usingParams,
        (response: PromiseResult<TData, TError>) => {
          if (GlobalFetcherCounter.get(uuid) !== count) {
            return;
          }

          if (response.type === 'success') {
            updateData(response.data!);
            setError(undefined);
            setStatus(GrootStatus.success);
          } else {
            setStatus(GrootStatus.error);
            updateData(undefined);
            setError(response.error);
            setStatus(GrootStatus.error);

            if (options.errorCallback) {
              options.errorCallback(response.error!);
            }
          }
        },
      );
    },
    [currentParamsRef, fetcherManager, options, updateCurrentParams, updateData, uuid],
  );

  const req = useCallback(
    (...params: TParams | []) => {
      return reqImpl(params.length ? (params as TParams) : undefined);
    },
    [reqImpl],
  );

  const refresh = useCallback(
    (...params: TParams | []) => {
      fetcherManager.clearCache(currentCacheKey);
      reqImpl(params.length ? (params as TParams) : undefined, true);
    },
    [currentCacheKey, fetcherManager, reqImpl],
  );

  useEffect(() => {
    if (!currentCacheKey) return;

    const callback = (response: PromiseResult<TData, TError>) => {
      if (response.type === 'success') {
        if (response.data === dataRef.current) {
          // hint: Deep copy can be considered, but for now, let the user do this
          return;
        }
        updateData(response.data! as TData);
        setStatus(GrootStatus.success);
      } else {
        setStatus(GrootStatus.error);
        updateData(undefined);
        setError(response.error!);

        if (options.errorCallback) {
          options.errorCallback(response.error!);
        }
      }
    };

    fetcherManager.addObserver(currentCacheKey, callback);

    return () => {
      fetcherManager.removeObserver(currentCacheKey, callback);
    };
  }, [currentCacheKey, dataRef, fetcherManager, options, updateData]);

  useEffect(() => {
    if (options.auto) {
      req();
    }
    return () => {
      // do nothing
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    error,
    status,
    req,
    refresh,
  };
}
