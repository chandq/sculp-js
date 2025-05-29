import { pathJoin, pathNormalize } from '../src/path';
import './utils';

test('.normalize: 标准', () => {
  expect(pathNormalize('/a/b/c')).toEqual('/a/b/c');
  expect(pathNormalize('./a/b/c')).toEqual('./a/b/c');
  expect(pathNormalize('../a/b/c')).toEqual('../a/b/c');
  expect(pathNormalize('/a/b/c/')).toEqual('/a/b/c/');
  expect(pathNormalize('./a/b/c/')).toEqual('./a/b/c/');
  expect(pathNormalize('../a/b/c/')).toEqual('../a/b/c/');
});

test('.pathNormalize: 当前', () => {
  expect(pathNormalize('/a/b/./c')).toEqual('/a/b/c');
  expect(pathNormalize('./a/b/./c')).toEqual('./a/b/c');
  expect(pathNormalize('../a/b/./c')).toEqual('../a/b/c');
  expect(pathNormalize('/a/b/./c/')).toEqual('/a/b/c/');
  expect(pathNormalize('./a/b/./c/')).toEqual('./a/b/c/');
  expect(pathNormalize('../a/b/./c/')).toEqual('../a/b/c/');
});

test('.pathNormalize: 父级', () => {
  expect(pathNormalize('/a/b/../c')).toEqual('/a/c');
  expect(pathNormalize('./a/b/../c')).toEqual('./a/c');
  expect(pathNormalize('../a/b/../c')).toEqual('../a/c');
  expect(pathNormalize('/a/b/../c/')).toEqual('/a/c/');
  expect(pathNormalize('./a/b/../c/')).toEqual('./a/c/');
  expect(pathNormalize('../a/b/../c/')).toEqual('../a/c/');
});

test('.pathNormalize: 多个分隔符', () => {
  expect(pathNormalize('a//b/c//')).toEqual('a/b/c/');
  expect(pathNormalize('a//b/c///')).toEqual('a/b/c/');
  expect(pathNormalize('a//b///c///')).toEqual('a/b/c/');
});

test('.pathNormalize: 多个定位符', () => {
  expect(pathNormalize('a/./b/c/')).toEqual('a/b/c/');
  expect(pathNormalize('a/../b/c/')).toEqual('b/c/');
  expect(pathNormalize('a/.../b/c/')).toEqual('b/c/');
  expect(pathNormalize('a/..../b/c/')).toEqual('b/c/');
  expect(pathNormalize('a/...../b/c/')).toEqual('b/c/');
});

test('.pathNormalize: 多层定位', () => {
  expect(pathNormalize('../a/b/../c')).toEqual('../a/c');
  expect(pathNormalize('../a/b/../c/.')).toEqual('../a/c');
  expect(pathNormalize('../a/b/../c/..')).toEqual('../a');

  expect(pathNormalize('../a/b/../../c')).toEqual('../c');
  expect(pathNormalize('../a/b/../../c/.')).toEqual('../c');
  expect(pathNormalize('../a/b/../../c/..')).toEqual('..');

  expect(pathNormalize('../a/b/../../../c')).toEqual('../../c');
  expect(pathNormalize('../a/b/../../../c/.')).toEqual('../../c');
  expect(pathNormalize('../a/b/../../../c/..')).toEqual('../..');
});

test('.pathJoin', () => {
  expect(pathJoin('.', 'a', 'b', 'c')).toEqual('./a/b/c');
  expect(pathJoin('.', 'a/b', 'c')).toEqual('./a/b/c');
  expect(pathJoin('.', '/a/b', 'c')).toEqual('./a/b/c');
  expect(pathJoin('.', '/a/b/', 'c')).toEqual('./a/b/c');
  expect(pathJoin('.', './a/b/', 'c')).toEqual('./a/b/c');
  expect(pathJoin('.', '/a/b/.', 'c')).toEqual('./a/b/c');
  expect(pathJoin('.', './a/b/.', 'c')).toEqual('./a/b/c');
  expect(pathJoin('/', './a/b/.', 'c')).toEqual('/a/b/c');
  expect(pathJoin('a', 'b', 'c')).toEqual('a/b/c');
  expect(pathJoin('/a', 'b', 'c')).toEqual('/a/b/c');
  expect(pathJoin('a', 'b', 'c/')).toEqual('a/b/c/');
  expect(pathJoin('/a', 'b', 'c/')).toEqual('/a/b/c/');
  expect(pathJoin('/a', '/b', 'c/')).toEqual('/a/b/c/');
  expect(pathJoin('/a', '/b/', 'c/')).toEqual('/a/b/c/');
  expect(pathJoin('/a', '/b/', '/c/')).toEqual('/a/b/c/');
  expect(pathJoin('/a/', '/b/', '/c/')).toEqual('/a/b/c/');
});
