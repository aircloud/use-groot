import { CacheManager } from './cache';
import { ObserverCallback, PromiseResult } from './schema';

class FetcherInstance {
  promiseCache = new Map<string, Promise<any>>();
  observerMap = new Map<string, ObserverCallback[]>();

  resultCacheLRU = new CacheManager({
    size: 4,
  });

  fetch<TData, TParams extends any[]>(
    cacheKey: string,
    fetcher: (...args: any) => Promise<any>,
    params: TParams | undefined,
    callback: (data: PromiseResult<TData>) => void,
  ) {
    if (this.resultCacheLRU.cache.has(cacheKey)) {
      console.log(
        `[xxx] fetcherInstance result cache for cacheKey: ${cacheKey} is`,
        this.resultCacheLRU.cache.get(cacheKey),
      );
      callback(this.resultCacheLRU.cache.get(cacheKey)!);
      return;
    }

    if (this.promiseCache.has(cacheKey)) {
      console.log(`[xxx] fetcherInstance promise cache for cacheKey: ${cacheKey}`);
      this.promiseCache
        .get(cacheKey)!
        .then((value: any) => {
          const res = {
            type: 'success',
            data: value as unknown as TData,
          } as PromiseResult<TData>;
          callback(res);
          console.log(`before invoke observer for ${cacheKey}, res:`, res);
          this.invokeObserver(cacheKey, res);
        })
        .catch((e) => {
          const res = {
            type: 'error',
            error: e,
          } as PromiseResult<TData>;
          callback(res);
          console.log(`before invoke observer for ${cacheKey}, res:`, res);
          this.invokeObserver(cacheKey, res);
        });
      return;
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
        } as PromiseResult<TData>;
        this.resultCacheLRU.cache.set(cacheKey, res);
        callback(res);
        this.invokeObserver(cacheKey, res);
      })
      .catch((e) => {
        this.promiseCache.delete(cacheKey);
        const res = {
          type: 'error',
          error: e,
        } as PromiseResult<TData>;
        callback(res);
      });
  }

  clearCache = (cacheKey: string) => {
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
      // error handler
      return;
    }
    observerList.splice(observerList.indexOf(observer), 1);

    if (!observerList.length) {
      this.observerMap.delete(cacheKey);
      return;
    }

    this.observerMap.set(cacheKey, observerList);
  };

  invokeObserver = (cacheKey: string, result: PromiseResult<unknown>) => {
    if (!this.observerMap.get(cacheKey)) return;
    const observerList = this.observerMap.get(cacheKey)!;

    console.log(`---> invokeObserver cacheKey: ${cacheKey} observerList`, observerList);
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

export const GlobalFetcherInstance = new FetcherInstance();
export const GlobalFetcherCounter = new FetcherCounter();
