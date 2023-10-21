# Config for new husky

## 1. Install husky

```bash
npm install husky --save-dev
```

## 2. 自动启用 husky

```bash
npm pkg set scripts.prepare="husky install"
```

## 3. Add commit-msg hook

> 新版husky中$HUSKY_GIT_PARAMS不再使用

```bash
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
```

## 4. 安装commitlint相关依赖

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

在根目录新建一个`commitlint.config.js`文件并加入如下内容：

```js
module.exports = {
  extends: ['@commitlint/config-conventional']
};
```

## 5. add pre-commit hook

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```
