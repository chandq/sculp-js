<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [sculp-js](./sculp-js.md) &gt; [throttle](./sculp-js.throttle.md)

## throttle variable

节流函数 节流就是节约流量，将连续触发的事件稀释成预设评率。 比如每间隔1秒执行一次函数，无论这期间触发多少次事件。 这有点像公交车，无论在站点等车的人多不多，公交车只会按时来一班，不会来一个人就来一辆公交车。

**Signature:**

```typescript
throttle: <F extends AnyFunc>(func: F, wait: number, immediate?: boolean) => ThrottleFunc<F>;
```
