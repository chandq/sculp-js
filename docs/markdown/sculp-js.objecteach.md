<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [sculp-js](./sculp-js.md) &gt; [objectEach](./sculp-js.objecteach.md)

## objectEach() function

遍历对象，返回 false 中断遍历

**Signature:**

```typescript
declare function objectEach<O extends AnyObject>(
  obj: O,
  iterator: (val: O[keyof O], key: Extract<keyof O, string>) => any
): void;
```

## Parameters

| Parameter | Type                                                               | Description |
| --------- | ------------------------------------------------------------------ | ----------- |
| obj       | O                                                                  |             |
| iterator  | (val: O\[keyof O\], key: Extract&lt;keyof O, string&gt;) =&gt; any |             |

**Returns:**

void