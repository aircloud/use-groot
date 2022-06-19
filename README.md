# use-groot

这是一个尚在开发中的基于 React Hooks 的请求管理库，目前还正在完善，如果你需要一个完善额库，可能 [swr](https://github.com/vercel/swr)、[use-request](https://ahooks.js.org/hooks/use-request/index) 或者 [react-query](https://react-query.tanstack.com/) 是你更好的选择。

不过相比之下，该库的目的在于：

- 只专注处理缓存和状态一致性问题，没有预设的额外请求。
- 支持动态 cacheKey，并且支持自定义缓存策略，尽可能地将缓存过程白盒化。
- 基于状态机流转思维开发。

## 使用

> 由于目前正在测试阶段，该库的发布版本会携带大量的 console 等内容，近期该库会发布更加稳定的版本

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

## 开发背景

最初，笔者的一个 React 项目面临的一个问题是：

- 页面中多个组件使用了相同的请求，我希望真正可以只发一次请求，并且后续其他组件更新该请求对应的数据的时候，所有组件可以一起更新。

实际上，这里的问题只是请求复用 + 数据一致性的问题，然而笔者尝试 swr 和 use-request 之后，发现普遍存在一些不满足需求的地方：

- 对于动态 cacheKey 支持并不好，甚至不支持。
- 提供了太多参数，以及预设内容，这些内容我并不需要，或者我可以在其他的业务逻辑中解决，配置太多，反而给我造成了额外的心智负担。

也因此，我只针对自己这里的需求，开发了这样一个功能比较简单的基于 React Hooks 的请求管理库。
