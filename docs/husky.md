# Config for new husky

## 1. Install husky, lint-staged

```bash
npm install husky lint-staged --save-dev
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

### 添加交互式git commit配置

1. install commitizen

```bash
npm install --save-dev commitizen
```

2. 初始化

```bash
npx commitizen init cz-conventional-changelog
```

执行完成后，会在package.json中追加以下配置：

```js
"config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  }
```

进入交互式git commit:

```bash
npx git-cz
```
