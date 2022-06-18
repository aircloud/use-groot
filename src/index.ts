import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { GlobalFetcherCounter, GlobalFetcherInstance } from './fetcher';
import { GrootOptions, GrootStatus, PromiseResult } from './schema';
export { GrootStatus } from './schema';

const useUpdate = () => {
  const [, setState] = useState({});
  return useCallback(() => setState({}), []);
};

export function useGroot<TData, TParams extends any[], TError = any>(
  options: GrootOptions<TData, TParams, TError>,
) {
  const [data, setData] = useState<TData | undefined>(undefined);
  const dataRef = useRef<TData | undefined>(data);
  const [status, setStatus] = useState<GrootStatus>(GrootStatus.init);
  const [uuid] = useState(uuidV4());
  const [currentParams, setCurrentParams] = useState(options.params);
  const update = useUpdate();
  const [currentCacheKey, setCurrentCacheKey] = useState<string | null>(null);

  console.log('uuid:', uuid);

  const req = (params?: TParams) => {
    const count = GlobalFetcherCounter.increase(uuid);
    console.log('count:', count);

    const usingParams = params || currentParams || ([] as unknown[] as TParams);
    const usingCacheKey =
      typeof options.cacheKey == 'function'
        ? options.cacheKey(...usingParams)
        : (options.cacheKey as string);

    console.error('usingCacheKey:', usingCacheKey);

    if (!options.swr) {
      setData(undefined);
      dataRef.current = undefined;
    }
    setStatus(GrootStatus.pending);
    setCurrentParams(usingParams);
    setCurrentCacheKey(usingCacheKey);

    GlobalFetcherInstance.fetch(usingCacheKey, options.fetcher, usingParams, (response) => {
      console.log('get response:', response, GlobalFetcherCounter.get(uuid));

      if (GlobalFetcherCounter.get(uuid) !== count) {
        console.warn(`---> counter not equal, just return`);
        return;
      }

      if (response.type === 'success') {
        setData(response.data! as TData);
        dataRef.current = response.data! as TData;
        setStatus(GrootStatus.success);
      } else {
        setStatus(GrootStatus.error);
        // TODO: maybe error callback
      }
    });
  };

  useEffect(() => {
    console.log('currentCacheKey change to:', currentCacheKey);

    if (!currentCacheKey) return;

    const callback = (response: PromiseResult<TData>) => {
      console.log(`this is a callback for ${currentCacheKey} and get value value:`, response);

      if (response.type === 'success') {
        if (response.data === dataRef.current) {
          console.log('data is same, skip!!!!');
        }
        setData(response.data! as TData);
        dataRef.current = response.data! as TData;
        setStatus(GrootStatus.success);
      } else {
        setStatus(GrootStatus.error);
        if (options.errorCallback) {
          options.errorCallback(response.error);
        }
        // TODO: maybe error callback
      }
    };

    GlobalFetcherInstance.addObserver(currentCacheKey, callback);

    return () => {
      GlobalFetcherInstance.removeObserver(currentCacheKey, callback);
    };
  }, [currentCacheKey, options]);

  const refresh = (params?: TParams) => {
    if (!currentCacheKey) {
      console.error('no currentCacheKey');
      return;
    }

    console.log('refresh currentCacheKey:', currentCacheKey);
    GlobalFetcherInstance.clearCache(currentCacheKey);
    req(params);
  };

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
    status,
    req,
    refresh,
  };
}
