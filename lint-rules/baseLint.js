module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    // 禁止在循环中出现 await
    'no-await-in-loop': 0,
    // 禁止 console
    'no-console': 1,
    'no-debugger': 1,
    'no-alert': 1,
    // 禁止在嵌套的块中出现变量声明或 function 声明
    // "no-inner-declarations":0,
    // 禁止未使用的变量
    'no-unused-vars': [
      'warn', // 未使用的变量提示
      {
        // args: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    // 是否可在变量或函数定义之前使用它们
    'no-use-before-define': [
      'off',
      {
        functions: false
      }
    ],
    'no-dupe-args': 2,
    'no-func-assign': 'error',
    'no-import-assign': 'error',
    'no-new-symbol': 'error',
    'no-obj-calls': 'error',
    // 禁止直接在对象上调用某些 Object.prototype 方法
    'no-prototype-builtins': 0,
    'func-call-spacing': ['error', 'never'], // 函数调用函数名和括号中间不允许空格
    'no-unsafe-negation': ['warn', { enforceForOrderingRelations: true }],
    'valid-typeof': ['error', { requireStringLiterals: false }],
    eqeqeq: ['warn', 'smart'],
    'no-extra-semi': 'warn',
    // 禁止不规则的空白
    'no-irregular-whitespace': 1,
    // 不允许在字符类语法中出现由多个代码点组成的字符
    'no-misleading-character-class': 0,
    // 禁止在 finally 语句块中出现控制流语句
    'no-unsafe-finally': 0,
    // 指定程序中允许的最大环路复杂度,单个 if 语句最大else数
    complexity: 0,
    // 强制所有控制语句使用一致的括号风格
    curly: 2,
    // 要求 switch 语句中有 default 分支
    'default-case': 0,
    // 要求使用点号,如 foo.bar, 错误示例：foo["bar"]
    'dot-notation': 0,
    // 禁用 arguments.caller 或 arguments.callee
    'no-caller': 2,
    // 禁止出现空函数
    'no-empty-function': 0,
    // 禁止在没有类型检查操作符的情况下与 null 进行比较
    'no-eq-null': 1,
    // 禁用 eval()
    'no-eval': 2,
    // 禁止使用类似 eval() 的方法
    'no-implied-eval': 2,
    // 禁用不必要的嵌套块
    'no-lone-blocks': 2,
    // 禁止在循环语句中出现包含不安全引用的函数声明
    'no-loop-func': 2,
    // 禁止使用多个空格
    'no-multi-spaces': 2,
    // 禁止使用多行字符串
    'no-multi-str': 2,
    // 禁止对 Function 对象使用 new 操作符
    'no-new-func': 0,
    // 禁止对 String，Number 和 Boolean 使用 new 操作符
    'no-new-wrappers': 2,
    // 禁止在字符串中使用八进制转义序列
    'no-octal-escape': 2,
    // 禁止对 function 的参数进行重新赋值
    'no-param-reassign': 0,
    // 禁用 __proto__ 属性
    'no-proto': 2,
    // 禁止使用 javascript: url
    'no-script-url': 2,
    // 禁止自身比较
    'no-self-compare': 1,
    // 禁止抛出异常字面量
    'no-throw-literal': 2,
    // 禁用一成不变的循环条件
    'no-unmodified-loop-condition': 1,
    // 禁止不必要的 .call() 和 .apply()
    'no-useless-call': 1,
    // 禁止使用不带 await 表达式的 async 函数
    'require-await': 1,
    // 要求 IIFE 使用括号括起来
    'wrap-iife': ['error', 'outside'],
    // 使用ts校验规则,大括号风格要求
    // "brace-style": ["warn", "1tbs"],
    // 关闭：使用ts校验规则。强制使用骆驼拼写法命名约定
    camelcase: 'off',
    // 强制使用一致的缩进，2个空格
    indent: ['error', 2],
    // 要求或禁止类成员之间出现空行
    'lines-between-class-members': 1,
    // 强制可嵌套的块的最大深度
    'max-depth': 2,
    // 强制最大行数 1000
    'max-lines': ['error', { max: 2000 }],
    // 强制函数最大代码行数
    'max-lines-per-function': 0,
    // 强制回调函数最大嵌套深度,3层
    'max-nested-callbacks': 0,
    // 限制函数定义中最大参数个数
    'max-params': 0,
    // 禁止在代码后使用内联注释
    'no-inline-comments': 0,
    // 禁止混合使用不同的操作符
    'no-mixed-operators': 1,
    // 禁止出现多行空行,强制最大连续空行数 1
    'no-multiple-empty-lines': ['warn', { max: 1 }],
    // 禁用嵌套的三元表达式,禁止三元表达式套娃
    'no-nested-ternary': 0,
    // 禁止可以在有更简单的可替代的表达式时使用三元操作符
    'no-unneeded-ternary': 1,
    // 禁止属性前有空白
    'no-whitespace-before-property': 2,
    // 暂不使用：强制操作符使用一致的换行符风格
    // "operator-linebreak": ["warn", "before"],
    // 要求或禁止在语句间填充空行,要求在 import后 与指定关键字之间，添加空行
    'padding-line-between-statements': [
      'warn',
      {
        blankLine: 'always',
        prev: 'import',
        next: ['export', 'let', 'const', 'if', 'function', 'multiline-block-like']
      }
    ],
    // 要求操作符周围有空格
    'space-infix-ops': ['warn', { int32Hint: false }],
    // 强制箭头函数的箭头前后使用一致的空格
    'arrow-spacing': 1,
    // 禁止重复模块导入
    'no-duplicate-imports': 0,
    // 禁止在 import 和 export 和解构赋值时将引用重命名为相同的名字
    'no-useless-rename': 1,
    // 要求使用 let 或 const 而不是 var
    'no-var': 1,
    // 要求使用 const 声明,那些声明后不再被修改的变量
    'prefer-const': [
      'warn',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false
      }
    ],
    // 要求使用模板字面量而非字符串连接
    'prefer-template': 0,
    // 禁止未使用的表达式
    'no-unused-expressions': 0,
    // 禁止不必要的布尔转换
    'no-extra-boolean-cast': 0
  }
};
