import LRU from 'lru-cache';

export interface CacheOptions {
  size: number;
}

export class CacheManager {
  lruCache: LRU<unknown, any>;

  constructor(options: CacheOptions) {
    const lruOptions = {
      max: options.size,

      // for use with tracking overall storage size
      // maxSize: 5000,
      // sizeCalculation: (value: any, key: any) => {
      // return 1
      // },

      // how long to live in ms
      ttl: 1000 * 60 * 5,

      // return stale items before removing from cache?
      allowStale: false,

      updateAgeOnGet: false,
      updateAgeOnHas: false,

      // async method to use for cache.fetch(), for
      // stale-while-revalidate type of behavior
    };

    this.lruCache = new LRU(lruOptions);
  }

  get cache() {
    return this.lruCache;
  }
}
