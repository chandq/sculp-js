# Config for new husky

husky `v6.0`包含`break change`, 该文仅包含husky v8.x的安装配置，从v4.x迁移请参考 [Migrating from v4](https://typicode.github.io/husky/migrating-from-v4.html)

## 1. Install husky, lint-staged

```bash
npm install husky lint-staged --save-dev
```

## 2. 自动启用 husky

```bash
npm pkg set scripts.prepare="husky install" && npm run prepare
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
echo "module.exports = {extends: ['@commitlint/config-conventional']};" > commitlint.config.js
```

## 5. add pre-commit hook

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

## 添加交互式git commit配置

#### 1. install commitizen

```bash
npm install --save-dev commitizen
```

#### 2. 初始化

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

#### 3. 配置cz的命令

```bash
npm pkg set scripts.commit="git-cz"
```

## lint-staged的配置示例

在package.json中添加关于 `ts、tsx、js、jsx、vue、css、json、md`等代码的lint、prettier配置

```json
"lint-staged": {
    "*.[tj]s?(x)": [
      "eslint --fix"
    ],
    "*.vue": [
      "eslint --fix"
    ],
    "*.{css,less,scss,json,md}": [
      "prettier --write"
    ]
  }
```
