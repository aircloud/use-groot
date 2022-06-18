import React, { useEffect } from 'react';
import './App.css';
import { useGroot } from '../../src/index';
import { fetcherXXX, SubApp } from './SubApp';

function App() {
  const { data, status, req, refresh } = useGroot({
    fetcher: fetcherXXX,
    cacheKey: (params: string) => `cache_key_${params}`,
    auto: false,
  });

  useEffect(() => {
    req(['hello_world']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('useGroot value:', data);

  return (
    <div className="App">
      <div className="part-app">
        <button
          onClick={() => {
            console.log('click logo req!');
            req(['hello_world']);
          }}
          style={{ cursor: 'pointer' }}
        >
          req
        </button>
        <button
          onClick={() => {
            console.log('click logo req!');
            refresh();
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
