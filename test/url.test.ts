import { urlParse, urlDelParams, urlStringify, urlSetParams } from '../src/url';
import './utils';

test('urlParse 完整', () => {
  const href = 'http://u:p@www.baidu.com:3001/a/b?c=d&e=f#gggh';
  const url = urlParse(href);

  expect(url.protocol).toBe('http:');
  expect(url.auth).toBe('u:p');
  expect(url.host).toBe('www.baidu.com:3001');
  expect(url.port).toBe('3001');
  expect(url.hostname).toBe('www.baidu.com');
  expect(url.hash).toBe('#gggh');
  expect(url.search).toBe('?c=d&e=f');
  expect(url.searchParams.c).toBe('d');
  expect(url.searchParams.e).toBe('f');
  expect(url.query).toBe('c=d&e=f');
  expect(url.pathname).toBe('/a/b');
  expect(url.path).toBe('/a/b?c=d&e=f');
  expect(url.href).toBe(href);

  const url2 = urlParse(href, false);
  expect(url2.pathname).toBe('/a/b');
  expect(url2.path).toBe('/a/b?c=d&e=f');
  expect(url2.href).toBe(href);
});

test('urlParse 普通', () => {
  const href = 'http://www.baidu.com/a/b?c=d&e=f#gggh';
  const url = urlParse(href);

  expect(url.protocol).toBe('http:');
  expect(url.auth).toBe('');
  expect(url.host).toBe('www.baidu.com');
  expect(url.port).toBe('');
  expect(url.hostname).toBe('www.baidu.com');
  expect(url.hash).toBe('#gggh');
  expect(url.search).toBe('?c=d&e=f');
  expect(url.searchParams.c).toBe('d');
  expect(url.searchParams.e).toBe('f');
  expect(url.query).toBe('c=d&e=f');
  expect(url.pathname).toBe('/a/b');
  expect(url.path).toBe('/a/b?c=d&e=f');
  expect(url.href).toBe(href);
});

test('urlStringify', () => {
  const href = 'http://www.baidu.com:3456/a/b?c=d&e=f#gggh';
  const url = urlParse(href);
  url.searchParams.e = ['f', 'g'];
  delete url.searchParams.c;
  expect(urlStringify(url)).toBe('http://www.baidu.com:3456/a/b?e=f&e=g#gggh');
  url.hash = 'haha';
  expect(urlStringify(url)).toBe('http://www.baidu.com:3456/a/b?e=f&e=g#haha');
});

test('urlSetParams + urlDelQuery', () => {
  const href1 = 'http://www.baidu.com:3456/a/b?c=d&e=f&g=1&h=2&g=3#gggh';

  const href2 = urlDelParams(href1, ['c']);
  // console.log(href2);
  const url2 = urlParse(href2);
  expect(url2.searchParams).toEqual({ e: 'f', g: ['1', '3'], h: '2' });

  const href3 = urlDelParams(href2, ['g']);
  // console.log(href3);
  const url3 = urlParse(href3);
  expect(url3.searchParams).toEqual({ e: 'f', h: '2' });

  const href4 = urlSetParams(href3, { h: '4', i: [5, 6] });
  // console.log(href4);
  const url4 = urlParse(href4);
  expect(url4.searchParams).toEqual({ e: 'f', h: '4', i: ['5', '6'] });
});
