import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useGroot } from '../src/index';

export function sleep(time: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, time));
}

function fetcherForTest(param: string, index: number): Promise<{ value: string }> {
  return new Promise((rs, rj) => {
    setTimeout(() => {
      rs({ value: `test_${param}_${index}` });
    }, 1000);
  });
}

describe('delayed execution', () => {
  beforeEach(() => {});
  afterEach(() => {});
  it('basic execute', async () => {
    const view = renderHook(() =>
      useGroot({
        fetcher: fetcherForTest,
        cacheKey: (params: string) => `cache_key_${params}`,
        auto: false,
      }),
    );

    expect(view.result.current.data).toBe(undefined);
    view.result.current.req(['hello_world', 1]);
    view.rerender();

    await act(() => sleep(1200));
    expect(view.result.current.data?.value).toBe('test_hello_world_1');
  });

  it('double execute', async () => {
    const { result: hook1 } = renderHook(() =>
      useGroot({
        fetcher: fetcherForTest,
        cacheKey: (params: string) => `cache_key_${params}`,
        auto: false,
      }),
    );

    const { result: hook2 } = renderHook(() =>
      useGroot({
        fetcher: fetcherForTest,
        cacheKey: (params: string) => `cache_key_${params}`,
        auto: false,
      }),
    );

    expect(hook1.current.data).toBe(undefined);

    hook1.current.req(['hello_world', 1]);
    hook2.current.req(['hello_world', 1]);

    await act(() => sleep(1200));

    expect(hook1.current.data?.value).toBe('test_hello_world_1');
    expect(hook2.current.data?.value).toBe('test_hello_world_1');

    hook1.current.refresh(['hello_world', 2]);

    await act(() => sleep(1200));

    expect(hook1.current.data?.value).toBe('test_hello_world_2');
    expect(hook2.current.data?.value).toBe('test_hello_world_2');
  });
});
