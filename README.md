# use-groot

这是一个尚在开发中的基于 React Hooks 的请求管理库，目前还正在开发中，如果你需要一个完善额库，可能 [swr](https://github.com/vercel/swr) 或者 [use-request](https://ahooks.js.org/hooks/use-request/index) 是你更好的选择。

不过相比之下，该库的目的在于：

* 只专注处理缓存和状态一致性问题，没有预设的额外请求，例如页面聚焦时等。
* 支持动态 cacheKey，并且计划支持自定义缓存策略（目前使用了 LRU）
* 基于状态机流转思维供使用者使用

## 使用

这部分尚在完善中。