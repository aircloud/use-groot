import { CacheManager } from './cache';
import {
  GrootFetcherManagerOptions,
  GrootPromiseResponse,
  ObserverCallback,
  PromiseResult,
} from './schema';

export class GrootFetcherManager {
  promiseCache = new Map<string, Promise<any>>();
  observerMap = new Map<string, ObserverCallback[]>();
  resultCacheLRU: CacheManager;

  constructor(options: GrootFetcherManagerOptions) {
    this.resultCacheLRU = new CacheManager({
      size: options.cacheSize,
    });
  }

  fetch<TData, TParams extends any[], TError>(
    cacheKey: string,
    fetcher: (...args: any) => Promise<any>,
    params: TParams | undefined,
    callback: (data: PromiseResult<TData, TError>) => void,
  ): Promise<GrootPromiseResponse<TData>> {
    let singalResolve: (value: GrootPromiseResponse<TData>) => void,
      singalReject: (reason?: any) => void;

    const fetchSingalPromise = new Promise<GrootPromiseResponse<TData>>((rs, rj) => {
      singalResolve = rs;
      singalReject = rj;
    });

    if (this.resultCacheLRU.cache.has(cacheKey)) {
      callback(this.resultCacheLRU.cache.get(cacheKey)!);
      return Promise.resolve({
        success: true,
        data: this.resultCacheLRU.cache.get(cacheKey)!,
      });
    }

    if (this.promiseCache.has(cacheKey)) {
      this.promiseCache
        .get(cacheKey)!
        .then((value: any) => {
          const res = {
            type: 'success',
            data: value as unknown as TData,
          } as PromiseResult<TData, TError>;
          callback(res);
          this.invokeObserver(cacheKey, res);
          singalResolve({
            success: true,
            data: value as unknown as TData,
          });
        })
        .catch((e) => {
          const res = {
            type: 'error',
            error: e,
          } as PromiseResult<TData, TError>;
          callback(res);
          this.invokeObserver(cacheKey, res);
          singalReject('cache internal error');
        });
      return fetchSingalPromise;
    }

    const promise = fetcher(...(params || []));
    this.promiseCache.set(cacheKey, promise);

    // no use promise.finally for compatibility
    promise
      .then((data) => {
        this.promiseCache.delete(cacheKey);
        const res = {
          type: 'success',
          data: data as unknown as TData,
        } as PromiseResult<TData, TError>;
        this.resultCacheLRU.cache.set(cacheKey, res);
        callback(res);
        this.invokeObserver(cacheKey, res);
        singalResolve({
          success: true,
          data: data as unknown as TData,
        });
      })
      .catch((e) => {
        this.promiseCache.delete(cacheKey);
        const res = {
          type: 'error',
          error: e,
        } as PromiseResult<TData, TError>;
        callback(res);
        this.invokeObserver(cacheKey, res);
        singalReject('request internal error');
      });

    return fetchSingalPromise;
  }

  clearCache = (cacheKey: string | null) => {
    if (!cacheKey) return;
    this.resultCacheLRU.cache.delete(cacheKey);
  };

  addObserver = (cacheKey: string, observer: ObserverCallback) => {
    if (this.observerMap.has(cacheKey)) {
      this.observerMap.set(cacheKey, [...this.observerMap.get(cacheKey)!, observer]);
    } else {
      this.observerMap.set(cacheKey, [observer]);
    }
  };

  removeObserver = (cacheKey: string, observer: ObserverCallback) => {
    const observerList = this.observerMap.get(cacheKey);
    if (!observerList) {
      // maybe error handler
      return;
    }
    observerList.splice(observerList.indexOf(observer), 1);

    if (!observerList.length) {
      this.observerMap.delete(cacheKey);
      return;
    }

    this.observerMap.set(cacheKey, observerList);
  };

  invokeObserver = (cacheKey: string, result: PromiseResult<unknown, unknown>) => {
    if (!this.observerMap.get(cacheKey)) return;
    const observerList = this.observerMap.get(cacheKey)!;
    for (const observer of observerList) {
      observer(result);
    }
  };
}

class FetcherCounter {
  counter = new Map<string, number>();
  begin = 0;
  increase = (uuid: string) => {
    if (!this.counter.has(uuid)) {
      this.counter.set(uuid, this.begin);
      return this.begin;
    } else {
      const newCount = 1 + this.counter.get(uuid)!;
      this.counter.set(uuid, newCount);
      return newCount;
    }
  };

  get = (uuid: string) => {
    return this.counter.get(uuid);
  };
}

class FunctionCacheKeyManager {
  cacheKeyMap = new Map<Function, number>();
  getId = (func: Function) => {
    if (this.cacheKeyMap.has(func)) {
      return this.cacheKeyMap.get(func);
    }
    const nextIndex = this.cacheKeyMap.size + 1;
    this.cacheKeyMap.set(func, nextIndex);
    return nextIndex;
  };
}

export const GlobalFetcherManager = new GrootFetcherManager({
  cacheSize: 20,
});
export const GlobalFetcherCounter = new FetcherCounter();
export const GlobalFetcherKeyManager = new FunctionCacheKeyManager();
