import React, { useEffect } from 'react';
import { useGroot } from '../../src/index';

export async function fetcher(param: string): Promise<{ value: string }> {
  return new Promise((rs, rj) => {
    setTimeout(() => {
      rs({ value: `res_for_${param}_${Date.now()}` });
    }, 1000);
  });
}

export const SubApp = () => {
  const { data, status, req } = useGroot({
    fetcher,
    cacheKey: (params: string) => `cache_key_${params}`,
    auto: false,
  });

  useEffect(() => {
    req(['hello_world']);
  }, [req]);

  return (
    <div>
      <i>This is Sub App</i>: {data?.value}
    </div>
  );
};
