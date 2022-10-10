import React, { useEffect } from 'react';
import './App.css';
import { useGroot } from '../../src/index';
import { fetcher, SubApp } from './SubApp';

function App() {
  const { data, status, req, refresh } = useGroot({
    fetcher: fetcher,
    cacheKey: (params: string, key: string) => `cache_key_${params}`,
    auto: false,
    swr: true,
  });

  useEffect(() => {
    req('hello_world', 'key').then((result) => {
      console.info('req1 result:', result);
    });
    req().then((result) => {
      console.info('req2 result:', result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('useGroot value:', data);

  return (
    <div className="App">
      <div className="part-app">
        <button
          onClick={() => {
            console.log('click logo req!');
            req('hello_world', 'key');
          }}
          style={{ cursor: 'pointer' }}
        >
          req
        </button>
        <button
          onClick={() => {
            console.log('click logo req!');
            refresh().then((result) => {
              console.info('refresh result:', result);
            });
          }}
          style={{ cursor: 'pointer' }}
        >
          refresh
        </button>
        <p>{data?.value}</p>
      </div>
      <div className="part-sub-app-1">
        <SubApp />
      </div>
      <div className="part-sub-app-2">
        <SubApp />
      </div>
    </div>
  );
}

export default App;
