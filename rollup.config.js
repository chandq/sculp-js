import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import subpathExternals from 'rollup-plugin-subpath-externals';
import { dts } from 'rollup-plugin-dts';
import clear from 'rollup-plugin-clear';
import pkg from './package.json' assert { type: 'json' };

const pkgName = pkg.name.includes('/') ? pkg.name.split('/')[1] : pkg.name;
const isCore = process.env.BUILD_TARGET === 'core'; // 适用于web、node、小程序等任何js运行环境

// banner
const banner =
  '/*!\n' +
  ` * ${pkg.name} v${pkg.version}\n` +
  ` * (c) 2023-present chandq\n` +
  ' * Released under the MIT License.\n' +
  ' */\n';
// 转换命名为驼峰命名
function transformCamel(str) {
  const re = /-(\w)/g;
  return str.replace(re, function ($0, $1) {
    return $1.toUpperCase();
  });
}
// umd的全局变量名
const moduleName = transformCamel(pkgName);

export default [
  {
    input: `src/${isCore ? 'core-index.ts' : 'index.ts'}`,
    output: [
      {
        dir: 'lib/cjs',
        format: 'cjs',
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
        exports: 'named',
        banner
      },
      {
        dir: 'lib/es',
        format: 'esm',
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
        exports: 'named',
        banner
      },
      {
        dir: 'lib/umd',
        format: 'umd',
        entryFileNames: 'index.js',
        name: moduleName,
        banner
      }
    ],
    plugins: [
      clear({
        targets: ['lib']
      }),
      subpathExternals(pkg),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'tsconfig.json',
        include: ['src/**/*.ts']
      }),
      json()
    ]
  },
  {
    // 生成 .d.ts 类型声明文件
    input: `src/${isCore ? 'core-index.ts' : 'index.ts'}`,
    output: {
      file: pkg.types,
      format: 'esm'
    },
    plugins: [dts()]
  }
];
