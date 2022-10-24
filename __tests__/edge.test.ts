import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GrootStatus } from '../lib';
import { useGroot } from '../src/index';

export function sleep(time: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, time));
}

describe('some edge cases', () => {
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

    hook1.current.req('hello_world').catch((e) => {
      // do nothing
    });
    hook2.current.req('hello_world').catch((e) => {
      // do nothing
    });

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
});
