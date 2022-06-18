import { describe, expect, it } from 'vitest';
import { CacheManager } from '../src/cache';

describe('catch test', () => {
  it('basic lru test', async () => {
    const cacheManager = new CacheManager({
      size: 4,
    });

    console.log('a:', cacheManager.cache.get('a'));
    cacheManager.cache.set('a', 1);
    cacheManager.cache.set('b', 1);
    cacheManager.cache.set('c', 1);
    cacheManager.cache.set('d', 1);
    cacheManager.cache.set('e', 1);
    expect(cacheManager.cache.get('a')).toBe(undefined);
    expect(cacheManager.cache.get('d')).toBe(1);
    expect(cacheManager.cache.get('c')).toBe(1);
    expect(cacheManager.cache.get('e')).toBe(1);
    expect(cacheManager.cache.get('b')).toBe(1);
    cacheManager.cache.set('f', 1);
    expect(cacheManager.cache.get('b')).toBe(1);
    expect(cacheManager.cache.get('d')).toBe(undefined);
    expect(cacheManager.cache.get('f')).toBe(1);
  });
});
