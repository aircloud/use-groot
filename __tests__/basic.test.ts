import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GrootStatus } from '../lib';
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
    view.result.current.req('hello_world', 1);
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

    hook1.current.req('hello_world', 1);
    hook2.current.req('hello_world', 1);

    await act(() => sleep(1200));

    expect(hook1.current.data?.value).toBe('test_hello_world_1');
    expect(hook2.current.data?.value).toBe('test_hello_world_1');

    hook1.current.refresh('hello_world', 2);

    await act(() => sleep(1200));

    expect(hook1.current.data?.value).toBe('test_hello_world_2');
    expect(hook2.current.data?.value).toBe('test_hello_world_2');
  });

  it('without cacheKey', async () => {
    let loop = 0;
    function fetchReturnLoopTime(param: string): Promise<{ value: string }> {
      return new Promise((rs, rj) => {
        setTimeout(() => {
          rs({ value: `test_${param}_${loop++}` });
        }, 100);
      });
    }

    const { result: hook1 } = renderHook(() =>
      useGroot({
        fetcher: fetchReturnLoopTime,
        auto: false,
      }),
    );

    const { result: hook2 } = renderHook(() =>
      useGroot({
        fetcher: fetchReturnLoopTime,
        auto: false,
      }),
    );

    expect(hook1.current.data).toBe(undefined);

    hook1.current.req('hello_world');
    hook2.current.req('hello_world');

    await act(() => sleep(120));

    expect(hook1.current.data?.value).toBe('test_hello_world_0');
    expect(hook2.current.data?.value).toBe('test_hello_world_0');

    hook1.current.refresh('hello_world');

    await act(() => sleep(120));

    expect(hook1.current.data?.value).toBe('test_hello_world_1');
    expect(hook2.current.data?.value).toBe('test_hello_world_1');
  });
  it('fail test', async () => {
    let reqTime = 0;
    function fetchReturnError(param: string): Promise<{ value: string }> {
      return new Promise((rs, rj) => {
        reqTime += 1;
        if (reqTime >= 2) {
          rs({ value: 'success' });
        }
        rj(new Error('custom error'));
      });
    }

    const { result: hook1 } = renderHook(() =>
      useGroot({
        fetcher: fetchReturnError,
        auto: false,
      }),
    );

    const { result: hook2 } = renderHook(() =>
      useGroot({
        fetcher: fetchReturnError,
        auto: false,
      }),
    );

    expect(hook1.current.data).toBe(undefined);

    hook1.current.req('hello_world');
    hook2.current.req('hello_world');

    await act(() => sleep(200));

    expect(hook1.current.data?.value).toBe(undefined);
    expect(hook2.current.data?.value).toBe(undefined);
    expect(reqTime).toBe(1);
    expect(hook1.current.status).toBe(GrootStatus.error);
    expect(hook2.current.status).toBe(GrootStatus.error);

    hook2.current.refresh();
    await act(() => sleep(200));

    expect(hook1.current.data?.value).toBe('success');
    expect(hook2.current.data?.value).toBe('success');
    expect(reqTime).toBe(2);
    expect(hook1.current.status).toBe(GrootStatus.success);
    expect(hook2.current.status).toBe(GrootStatus.success);
  });
  it('refresh test', async () => {
    function fetchReturnError(param: string): Promise<{ value: string }> {
      return new Promise((rs, rj) => {
        rs({ value: 'success' });
      });
    }

    const { result: hook1 } = renderHook(() =>
      useGroot({
        fetcher: fetchReturnError,
        auto: false,
      }),
    );

    hook1.current.refresh();
    await act(() => sleep(200));

    expect(hook1.current.data?.value).toBe('success');
  });
});
