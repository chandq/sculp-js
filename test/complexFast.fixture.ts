const fn = (x: number) => x * 2;
export function createComplexFastObject() {
  const shared = {
    score: 100,
    meta: { valid: true }
  };

  // const fn = (x: number) => x * 2;
  const date = new Date('2024-01-01T00:00:00Z');
  const regex = /fast-mode/gi;

  const deep = {
    level1: {
      level2: {
        level3: {
          level4: {
            payload: shared
          }
        }
      }
    }
  };

  const map = new Map<any, any>();
  map.set('config', {
    enabled: true,
    deep
  });
  map.set('stats', {
    count: 10,
    shared
  });

  const set = new Set<any>();
  set.add(shared);
  set.add(1);
  set.add('x');

  const root: any = {
    id: 'fast-root',
    fn,
    date,
    regex,
    shared,
    deep,
    map,
    set,
    list: [shared, deep, { copy: shared }]
  };

  // ✅ 单点循环（安全）
  // root.self = root;

  // ❌ 没有 root 进入 map / set
  // ❌ 没有 map / set 反向引用 root
  // ❌ 没有多点循环

  return root;
}
