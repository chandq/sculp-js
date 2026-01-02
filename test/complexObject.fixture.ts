export function createComplexObject() {
  const shared = { value: 42 };
  const fn = (x: number) => x + 1;
  const date = new Date('2024-01-01');
  const regex = /mega/gi;

  const mapKey = { id: 1 };
  const map = new Map<any, any>();
  const set = new Set<any>();

  const root: any = {
    name: 'root',
    fn,
    date,
    regex,
    shared,
    map,
    set,
    list: [shared, { deep: shared }]
  };

  map.set(mapKey, root);
  set.add(shared);
  set.add(mapKey);

  root.self = root;
  root.mapBack = map;

  return root;
}
