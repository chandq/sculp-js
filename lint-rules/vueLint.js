module.exports = {
  extends: ['plugin:vue/vue3-recommended'],
  rules: {
    'vue/multi-word-component-names': 0,
    'vue/no-async-in-computed-properties': 2,
    // 禁止元素的子内容被 v-html 或 v-text 等指令覆盖
    'vue/no-child-content': 0,
    'vue/no-deprecated-data-object-declaration': 2,
    'vue/no-computed-properties-in-data': 1,
    'vue/no-deprecated-destroyed-lifecycle': 1,
    'vue/no-deprecated-dollar-listeners-api': 1,
    'vue/no-deprecated-dollar-scopedslots-api': 1,
    'vue/no-deprecated-props-default-this': 2,
    'vue/no-deprecated-v-bind-sync': 1,
    'vue/no-export-in-script-setup': 2,
    'vue/no-mutating-props': [
      1,
      {
        shallowOnly: true
      }
    ],
    'vue/no-dupe-keys': 1,
    // defineExpose在await之前
    'vue/no-expose-after-await': 1,
    // lifecycle在await之前
    'vue/no-lifecycle-after-await': 1,
    'vue/no-watch-after-await': 1,
    'vue/no-ref-as-operand': 1,
    // 自定义组件名称避免和vue内置组件名称、标准html名称冲突
    'vue/no-reserved-component-names': [
      2,
      {
        disallowVue3BuiltInComponents: true
      }
    ],
    'vue/no-reserved-props': [
      2,
      {
        vueVersion: 3
      }
    ],
    // props解构
    'vue/no-setup-props-destructure': 1,
    'vue/no-template-key': 1,
    'vue/no-unused-components': [
      1,
      {
        ignoreWhenBindingPresent: true
      }
    ],
    'vue/no-unused-vars': [
      1,
      {
        ignorePattern: '^_'
      }
    ],
    'vue/no-useless-template-attributes': 1,
    'vue/no-v-for-template-key-on-child': 1,
    'vue/require-component-is': 1,
    'vue/require-v-for-key': 1,
    'vue/return-in-computed-property': 2,
    // 校验有效的v-bind
    'vue/valid-v-bind': 0,
    // 校验html标签属性值的冒号，关闭
    'vue/html-quotes': 0,
    // 控制单行标签属性个数，单行 最多6个属性，多行 每行最多1个属性
    'vue/max-attributes-per-line': [
      'warn',
      {
        singleline: {
          max: 6
        },
        multiline: {
          max: 1
        }
      }
    ],
    'vue/html-closing-bracket-newline': [
      1,
      {
        singleline: 'never',
        multiline: 'always'
      }
    ],
    'vue/html-closing-bracket-spacing': 0,
    'vue/html-end-tags': 2,
    'vue/html-indent': [
      1,
      2,
      {
        attribute: 1,
        baseIndent: 1,
        closeBracket: 0,
        alignAttributesVertically: true
      }
    ],
    // 关闭 强制单标签 写法
    'vue/html-self-closing': 0,
    // 关闭 插值语法内的括号检测，{{value}},{{ value }}
    'vue/mustache-interpolation-spacing': 0,
    // 关闭 强制要求porps设置默认值
    'vue/require-default-prop': 0,
    // 关闭 单行html元素的内容换行
    'vue/singleline-html-element-content-newline': 0,
    // 关闭 v-bind 风格校验 :foo="bar"，v-bind:foo="bar"
    'vue/v-bind-style': 0,
    // 关闭 slot 风格校验 v-slot="data" #default="data"
    'vue/v-slot-style': 0,
    // 关闭 元素属性顺序校验
    'vue/attributes-order': 0,
    'vue/v-on-event-hyphenation': 0,
    'vue/attribute-hyphenation': 0
  }
};
