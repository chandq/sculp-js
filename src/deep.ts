// 深拷贝或合并的工具类
const mergeUtils = {
  type: function (o) {
    return Object.prototype.toString.call(o).slice(8, -1).toLowerCase()
  },
  typeMap: {
    object: function () {
      return {}
    },
    array: function () {
      return []
    }
  },
  // 默认配置项
  defaults: {
    // 是否深合并
    isDeep: true,
    // 是否遍历合并源对象原型链上的属性
    includePrototype: true,
    // 用于对每个合并项进行自定义修正
    forEach: function (target, name, sourceItem) {
      target[name] = sourceItem
      return target
    }
  },
  // 将配置项合并到默认配置项
  init: function (options) {
    for (let name in options) {
      this.defaults[name] = options[name]
    }
    return this
  },
  merge: function () {
    let self = this
    let _default = self.defaults
    let i = 1
    let { length } = arguments
    let target = arguments[0] || {}
    let source
    let targetItem
    let sourceItem
    let tiType
    let siType
    let clone
    let name

    for (; i < length; i++) {
      // 判断源对象是否为空
      if ((source = arguments[i]) != null) {
        for (name in source) {
          // eslint-disable-next-line no-prototype-builtins
          const hasPro = source.hasOwnProperty(name)
          // 是否遍历源对象的原型链
          if (hasPro || _default.includePrototype) {
            targetItem = target[name]
            sourceItem = source[name]
            tiType = self.type(targetItem)
            siType = self.type(sourceItem)

            // 防止出现回环
            if (target === sourceItem) {
              continue
            }

            // 如果复制的是对象或者数组
            if (_default.isDeep && sourceItem != null && self.typeMap[siType]) {
              clone = targetItem != null && tiType === siType ? targetItem : self.typeMap[siType]()
              // 递归
              target[name] = self.merge(clone, sourceItem)
            } else {
              clone = hasPro ? target : Object.getPrototypeOf(target)
              // 处理每一个合并项
              clone = _default.forEach.call(self, clone, name, sourceItem)
            }
          }
        }
      }
    }
    return target
  }
}