<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [sculp-js](./sculp-js.md) &gt; [deepTraversal](./sculp-js.deeptraversal.md)

## deepTraversal() function

自定义深度优先遍历函数(支持continue和break操作)

**Signature:**

```typescript
declare function deepTraversal<V>(
  tree: ArrayLike<V>,
  iterator: (val: V, i: number, arr: ArrayLike<V>, parent: V | null, level: number) => any,
  children?: string,
  isReverse?: boolean
): void;
```

## Parameters

| Parameter | Type                                                                                     | Description                  |
| --------- | ---------------------------------------------------------------------------------------- | ---------------------------- |
| tree      | ArrayLike&lt;V&gt;                                                                       | 树形数据                     |
| iterator  | (val: V, i: number, arr: ArrayLike&lt;V&gt;, parent: V \| null, level: number) =&gt; any | 迭代函数                     |
| children  | string                                                                                   | _(Optional)_ 定制子元素的key |
| isReverse | boolean                                                                                  | _(Optional)_ 是否反向遍历    |

**Returns:**

void

{<!-- -->\*<!-- -->}