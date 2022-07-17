# use-groot

这是一个简单专注的 React Hooks 的请求管理库，目前已经生产环境可用。

不过你在使用之前，也可以尝试了解 [swr](https://github.com/vercel/swr)、[use-request](https://ahooks.js.org/hooks/use-request/index) 或者 [react-query](https://react-query.tanstack.com/)。

相比于以上提供的例子，该库的目的在于：

- 只专注处理缓存和状态一致性问题，没有预设的额外请求，使用的心智负担很低。
- 支持动态 cacheKey，并且支持自定义缓存策略，尽可能地将缓存过程白盒化。
- 基于状态机流转思维开发。

## 使用

```
pnpm add use-groot
```

基本使用可以参考 [demo](./demo/) 代码，这里给出核心的使用方法：

```
const { data, status, req, refresh } = useGroot({
  fetcher: fetcher,
  cacheKey: (params: string) => `cache_key_${params}`,
  auto: false,
});
```

参数说明：

```typescript
export interface GrootOptions<TData, TParams extends any[], TError> {
  // 一个返回 Promise 的数据获取函数
  fetcher: Fetcher<TData, TParams>;
  // 相同的 cacheKey 的请求会被复用，可以直接传递一个字符串，或者一个接收参数的函数。如果不传递，会直接通过参数序列化来标志
  cacheKey?: string | ((...args: TParams) => string);
  // 是否在定义 Hook 的时候自动获取一次数据
  auto: boolean;
  // 参数，如果不需要自动获取数据或者不需要参数，可以不填
  params?: TParams;
  // 是否开启 SWR （“SWR” 这个名字来自于 stale-while-revalidate：一种由 HTTP RFC 5861 推广的 HTTP 缓存失效策略。这种策略首先从缓存中返回数据（过期的），同时发送 fetch 请求（重新验证），最后得到最新数据。）
  // 如果希望更新数据的时候不闪屏，建议开启这个属性
  swr?: boolean;
  // 错误回调函数，可以用于打日志
  errorCallback?: (error: TError) => void;
  // 自定义的请求管理库，一般不需要传递
  fetcherManager?: GrootFetcherManager;
}
```

返回值说明：

```typescript
export interface GrootResponse<TData, TParams extends any[], TError> {
  // 响应数据
  data: TData | undefined;
  // 返回的错误
  error: TError | undefined;
  // 响应的状态，有 init、pending、success、error、refreshing 五种
  status: GrootStatus;
  // 请求函数，如果有缓存会直接使用
  req: (...params: TParams | []) => void;
  // 刷新函数，不使用缓存，并且会同时更新其他依赖此缓存的组件
  refresh: (...params: TParams | []) => void;
}
```

## 开发背景

最初，笔者的一个 React 项目面临的一个问题是：

- 页面中多个组件使用了相同的请求，我希望真正可以只发一次请求，并且后续其他组件更新该请求对应的数据的时候，所有组件可以一起更新。

实际上，这里的问题只是请求复用 + 数据一致性的问题，然而笔者尝试 swr 和 use-request 之后，发现普遍存在一些不满足需求的地方：

- 对于动态 cacheKey 支持并不好，甚至不支持。
- 提供了太多参数，以及预设内容，这些内容我并不需要，或者我可以在其他的业务逻辑中解决，配置太多，反而给我造成了额外的心智负担。

也因此，我只针对自己这里的需求，开发了这样一个功能比较简单的基于 React Hooks 的请求管理库。
