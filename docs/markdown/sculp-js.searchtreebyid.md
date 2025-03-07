<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [sculp-js](./sculp-js.md) &gt; [searchTreeById](./sculp-js.searchtreebyid.md)

## searchTreeById() function

在树中找到 id 为某个值的节点，并返回上游的所有父级节点

**Signature:**

```typescript
declare function searchTreeById<V>(tree: ArrayLike<V>, nodeId: IdLike, config?: ITreeConf): [IdLike[], ArrayLike<V>[]];
```

## Parameters

| Parameter | Type                                 | Description             |
| --------- | ------------------------------------ | ----------------------- |
| tree      | ArrayLike&lt;V&gt;                   | 树形数据                |
| nodeId    | [IdLike](./sculp-js.idlike.md)       | 元素ID                  |
| config    | [ITreeConf](./sculp-js.itreeconf.md) | _(Optional)_ 迭代配置项 |

**Returns:**

\[[IdLike](./sculp-js.idlike.md)<!-- -->\[\], ArrayLike&lt;V&gt;\[\]\]

{<!-- -->\[IdLike\[\], ITreeItem<V>\[\]\]<!-- -->} - 由parentId...childId, parentObject-childObject组成的二维数组
