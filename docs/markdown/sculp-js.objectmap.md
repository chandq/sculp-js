<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [sculp-js](./sculp-js.md) &gt; [objectMap](./sculp-js.objectmap.md)

## objectMap() function

对象映射

**Signature:**

```typescript
declare function objectMap<O extends AnyObject, T>(
  obj: O,
  iterator: (val: O[keyof O], key: Extract<keyof O, string>) => any
): Record<Extract<keyof O, string>, T>;
```

## Parameters

| Parameter | Type                                                               | Description |
| --------- | ------------------------------------------------------------------ | ----------- |
| obj       | O                                                                  |             |
| iterator  | (val: O\[keyof O\], key: Extract&lt;keyof O, string&gt;) =&gt; any |             |

**Returns:**

Record&lt;Extract&lt;keyof O, string&gt;, T&gt;

{<!-- -->Record<!-- -->&lt;<!-- -->Extract<!-- -->&lt;<!-- -->keyof O, string<!-- -->&gt;<!-- -->, T<!-- -->&gt;<!-- -->}
