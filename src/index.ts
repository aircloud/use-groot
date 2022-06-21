import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidV4 } from 'uuid';
import {
  GlobalFetcherCounter,
  GlobalFetcherKeyManager,
  GlobalFetcherManager,
  GrootFetcherManager,
} from './fetcher';
import { Fetcher, GrootStatus, PromiseResult } from './schema';
export { GrootStatus } from './schema';

// const useUpdate = () => {
//   const [, setState] = useState({});
//   return useCallback(() => setState({}), []);
// };

export interface GrootOptions<TData, TParams extends any[], TError> {
  fetcher: Fetcher<TData, TParams>;
  cacheKey?: string | ((...args: TParams) => string);
  auto: boolean;
  params?: TParams;
  swr?: boolean;
  errorCallback?: (error: TError) => void;
  fetcherManager?: GrootFetcherManager;
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
) {
  // For stability reasons, users are not expected to change the fetcherManager
  const [fetcherManager] = useState(options.fetcherManager || GlobalFetcherManager);
  const [error, setError] = useState<TError | undefined>(undefined);
  const [data, dataRef, updateData] = useRefState<TData | undefined>(undefined);
  const [status, setStatus] = useState<GrootStatus>(GrootStatus.init);
  const [uuid] = useState(uuidV4());
  const [_currentParams, currentParamsRef, updateCurrentParams] = useRefState(options.params);
  const [currentCacheKey, setCurrentCacheKey] = useState<string | null>(null);

  console.log('uuid:', uuid);

  const reqImpl = useCallback(
    (params?: TParams, refresh?: boolean) => {
      const count = GlobalFetcherCounter.increase(uuid);
      console.log('count:', count);

      const usingParams = params || currentParamsRef.current || ([] as unknown[] as TParams);
      const usingCacheKey =
        'cacheKey' in options
          ? typeof options.cacheKey == 'function'
            ? options.cacheKey(...usingParams)
            : (options.cacheKey as string)
          : `${GlobalFetcherKeyManager.getId(options.fetcher)}_${JSON.stringify(usingParams)}`;

      console.error('usingCacheKey:', usingCacheKey);

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
          console.log('get response:', response, GlobalFetcherCounter.get(uuid));

          if (GlobalFetcherCounter.get(uuid) !== count) {
            console.warn(`---> counter not equal, just return`);
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

  const req = (params?: TParams) => {
    return reqImpl(params);
  };

  const refresh = (params?: TParams) => {
    if (!currentCacheKey) {
      console.error('no currentCacheKey');
      return;
    }

    console.log('refresh currentCacheKey:', currentCacheKey);
    fetcherManager.clearCache(currentCacheKey);
    reqImpl(params, true);
  };

  useEffect(() => {
    console.log('currentCacheKey change to:', currentCacheKey);
    if (!currentCacheKey) return;

    const callback = (response: PromiseResult<TData, TError>) => {
      console.log(`this is a callback for ${currentCacheKey} and get value value:`, response);

      if (response.type === 'success') {
        if (response.data === dataRef.current) {
          console.log('data is same, skip!!!!');
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
        // TODO: maybe error callback
      }
    };

    fetcherManager.addObserver(currentCacheKey, callback);

    return () => {
      fetcherManager.removeObserver(currentCacheKey, callback);
    };
  }, [currentCacheKey, dataRef, fetcherManager, options, updateData]);

  useEffect(() => {
    if (options.auto) {
      console.log('useGroot req auto');
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
