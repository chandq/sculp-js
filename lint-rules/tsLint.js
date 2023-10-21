module.exports = {
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    // 禁止 声明未使用变量
    '@typescript-eslint/no-unused-vars': [
      1,
      {
        args: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    // 防止类型始终为真或始终为假的条件
    '@typescript-eslint/no-unnecessary-condition': 0,
    // 不允许成员访问any类型的变量
    '@typescript-eslint/no-unsafe-member-access': 0,
    // 强制使用无效合并运算符而不是逻辑链接
    '@typescript-eslint/prefer-nullish-coalescing': 0,
    // 要求将任何返回 Promise 的函数或方法 使用async
    '@typescript-eslint/promise-function-async': ['off'],
    // 对代码中的所有内容强制执行命名约定,
    '@typescript-eslint/naming-convention': [
      'off',
      // 验证 变量、函数 命名,允许前置 下划线
      {
        selector: ['variable', 'function'],
        format: ['camelCase'],
        leadingUnderscore: 'allow'
      },
      // types配置异常  验证布尔类型,正确示例：isEnabled
      {
        selector: 'variable',
        types: ['boolean'],
        format: ['PascalCase'],
        prefix: ['is', 'should', 'has', 'can', 'did', 'will']
      }
    ],
    //大括号风格要求
    '@typescript-eslint/brace-style': ['error', '1tbs'],
    // 要求函数和类方法的显式返回类型
    '@typescript-eslint/explicit-function-return-type': 0,
    // 强制使用特定的方法签名语法。
    '@typescript-eslint/method-signature-style': ['off', 'method'],
    // 禁止令人困惑的位置禁止非空断言
    '@typescript-eslint/no-confusing-non-null-assertion': ['error'],
    // 不允许对初始化为数字、字符串或布尔值的变量或参数进行显式类型声明
    '@typescript-eslint/no-inferrable-types': ['off'],
    // 禁止使用void泛型或返回类型之外的类型
    '@typescript-eslint/no-invalid-void-type': ['warn'],
    // 不允许在可选链表达式之后使用非空断言
    '@typescript-eslint/no-non-null-asserted-optional-chain': ['off'],
    // 禁止在类构造函数中使用参数属性
    '@typescript-eslint/no-parameter-properties': ['off'],
    //要求所有枚举成员都是文字值
    '@typescript-eslint/prefer-literal-enum-member': ['warn'],
    // 推荐使用简洁的可选链表达式而不是链式逻辑与
    '@typescript-eslint/prefer-optional-chain': 0,
    // 建议使用@ts-expect-error 代替 @ts-ignore
    '@typescript-eslint/prefer-ts-expect-error': ['off'],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-types': 'off',
    // 禁用require
    '@typescript-eslint/no-var-requires': 0,
    // 禁用ts注释
    '@typescript-eslint/ban-ts-comment': 0,
    // 禁用ts的断言 !
    '@typescript-eslint/no-non-null-assertion': 0
  }
};
