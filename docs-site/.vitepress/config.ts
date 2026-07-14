import { defineConfig } from 'vitepress';
import { SearchPlugin } from 'vitepress-plugin-search'

// 动态生成 API 侧边栏
const generateApiSidebar = () => {
  return [
    {
      text: '📖 API 总览',
      items: [
        { text: '目录', link: '/api/index' },
        { text: 'sculp-js（总览）', link: '/api/sculp-js' }
      ]
    },
    {
      text: '🔍 类型判断 (type)',
      collapsed: false,
      items: [
        { text: 'isString', link: '/api/sculp-js.isstring' },
        { text: 'isNumber', link: '/api/sculp-js.isnumber' },
        { text: 'isBoolean', link: '/api/sculp-js.isboolean' },
        { text: 'isFunction', link: '/api/sculp-js.isfunction' },
        { text: 'isObject', link: '/api/sculp-js.isobject' },
        { text: 'isArray', link: '/api/sculp-js.isarray' },
        { text: 'isDate', link: '/api/sculp-js.isdate' },
        { text: 'isRegExp', link: '/api/sculp-js.isregexp' },
        { text: 'isUndefined', link: '/api/sculp-js.isundefined' },
        { text: 'isNull', link: '/api/sculp-js.isnull' },
        { text: 'isNullOrUndef', link: '/api/sculp-js.isnullorundef' },
        { text: 'isError', link: '/api/sculp-js.iserror' },
        { text: 'isNaN', link: '/api/sculp-js.isnan_2' },
        { text: 'isPrimitive', link: '/api/sculp-js.isprimitive' },
        { text: 'isSymbol', link: '/api/sculp-js.issymbol' },
        { text: 'isBigInt', link: '/api/sculp-js.isbigint' },
        { text: 'isPlainObject', link: '/api/sculp-js.isplainobject' },
        { text: 'isFloat', link: '/api/sculp-js.isfloat' },
        { text: 'isInteger', link: '/api/sculp-js.isinteger' },
        { text: 'isDigit', link: '/api/sculp-js.isdigit' },
        { text: 'isNumerical', link: '/api/sculp-js.isnumerical' },
        { text: 'isJSONString', link: '/api/sculp-js.isjsonstring' },
        { text: 'isEmpty', link: '/api/sculp-js.isempty' },
        { text: 'isNodeList', link: '/api/sculp-js.isnodelist' },
        { text: 'isValidDate', link: '/api/sculp-js.isvaliddate' },
        { text: 'typeIs', link: '/api/sculp-js.typeis' },
        { text: 'is', link: '/api/sculp-js.is' }
      ]
    },
    {
      text: '📦 对象操作 (object)',
      collapsed: false,
      items: [
        { text: 'cloneDeep', link: '/api/sculp-js.clonedeep' },
        { text: 'objectAssign', link: '/api/sculp-js.objectassign' },
        { text: 'objectGet', link: '/api/sculp-js.objectget' },
        { text: 'objectHas', link: '/api/sculp-js.objecthas' },
        { text: 'objectEach', link: '/api/sculp-js.objecteach' },
        { text: 'objectEachAsync', link: '/api/sculp-js.objecteachasync' },
        { text: 'objectMap', link: '/api/sculp-js.objectmap' },
        { text: 'objectPick', link: '/api/sculp-js.objectpick' },
        { text: 'objectOmit', link: '/api/sculp-js.objectomit' },
        { text: 'objectFill', link: '/api/sculp-js.objectfill' }
      ]
    },
    {
      text: '📋 数组操作 (array)',
      collapsed: false,
      items: [
        { text: 'arrayEach', link: '/api/sculp-js.arrayeach' },
        { text: 'arrayEachAsync', link: '/api/sculp-js.arrayeachasync' },
        { text: 'arrayInsertBefore', link: '/api/sculp-js.arrayinsertbefore' },
        { text: 'arrayRemove', link: '/api/sculp-js.arrayremove' },
        { text: 'diffArray', link: '/api/sculp-js.diffarray' },
        { text: 'arrayLike', link: '/api/sculp-js.arraylike' }
      ]
    },
    {
      text: '🔤 字符串操作 (string)',
      collapsed: true,
      items: [
        { text: 'stringCamelCase', link: '/api/sculp-js.stringcamelcase' },
        { text: 'stringKebabCase', link: '/api/sculp-js.stringkebabcase' },
        { text: 'parseQueryParams', link: '/api/sculp-js.parsequeryparams' },
        { text: 'stringEscapeHTML', link: '/api/sculp-js.stringescapehtml' },
        { text: 'stringFormat', link: '/api/sculp-js.stringformat' },
        { text: 'stringFill', link: '/api/sculp-js.stringfill' },
        { text: 'stringAssign', link: '/api/sculp-js.stringassign' },
        { text: 'parseVarFromString', link: '/api/sculp-js.parsevarfromstring' },
        { text: 'replaceVarFromString', link: '/api/sculp-js.replacevarfromstring' },
        { text: 'escapeRegExp', link: '/api/sculp-js.escaperegexp' },
        { text: 'getStrWidthPx', link: '/api/sculp-js.getstrwidthpx' },
        { text: 'strip', link: '/api/sculp-js.strip' },
        { text: 'StringPool', link: '/api/sculp-js.string_pool' },
        { text: 'HexPool', link: '/api/sculp-js.hex_pool' },
        { text: 'StringArabicNumerals', link: '/api/sculp-js.string_arabic_numerals' },
        { text: 'StringLowercaseAlpha', link: '/api/sculp-js.string_lowercase_alpha' },
        { text: 'StringUppercaseAlpha', link: '/api/sculp-js.string_uppercase_alpha' }
      ]
    },
    {
      text: '🌳 树结构操作 (tree)',
      collapsed: true,
      items: [
        { text: 'forEachDeep', link: '/api/sculp-js.foreachdeep' },
        { text: 'mapDeep', link: '/api/sculp-js.mapdeep' },
        { text: 'findDeep', link: '/api/sculp-js.finddeep' },
        { text: 'filterDeep', link: '/api/sculp-js.filterdeep' },
        { text: 'flatTree', link: '/api/sculp-js.flattree' },
        { text: 'formatTree', link: '/api/sculp-js.formattree' },
        { text: 'fuzzySearchTree', link: '/api/sculp-js.fuzzysearchtree' },
        { text: 'searchTreeById', link: '/api/sculp-js.searchtreebyid' },
        { text: 'ITreeConf', link: '/api/sculp-js.itreeconf' },
        { text: 'IFilterCondition', link: '/api/sculp-js.ifiltercondition' },
        { text: 'ISearchTreeOpts', link: '/api/sculp-js.isearchtreeopts' }
      ]
    },
    {
      text: '✅ 验证器 (validator)',
      collapsed: true,
      items: [
        { text: 'isEmail', link: '/api/sculp-js.isemail' },
        { text: 'isPhone', link: '/api/sculp-js.isphone' },
        { text: 'isUrl', link: '/api/sculp-js.isurl' },
        { text: 'isIDNO', link: '/api/sculp-js.isidno' },
        { text: 'isIPv4', link: '/api/sculp-js.isipv4' },
        { text: 'isIPv6', link: '/api/sculp-js.isipv6' },
        { text: 'email_regex', link: '/api/sculp-js.email_regex' },
        { text: 'phone_regex', link: '/api/sculp-js.phone_regex' },
        { text: 'url_regex', link: '/api/sculp-js.url_regex' },
        { text: 'ipv4_regex', link: '/api/sculp-js.ipv4_regex' },
        { text: 'ipv6_regex', link: '/api/sculp-js.ipv6_regex' },
        { text: 'http_url_regex', link: '/api/sculp-js.http_url_regex' }
      ]
    },
    {
      text: '📅 日期处理 (date)',
      collapsed: true,
      items: [
        { text: 'formatDate', link: '/api/sculp-js.formatdate' },
        { text: 'adjustDate', link: '/api/sculp-js.adjustdate' },
        { text: 'dateParse', link: '/api/sculp-js.dateparse' },
        { text: 'dateToStart', link: '/api/sculp-js.datetostart' },
        { text: 'dateToEnd', link: '/api/sculp-js.datetoend' },
        { text: 'DateValue', link: '/api/sculp-js.datevalue' },
        { text: 'DateObj', link: '/api/sculp-js.dateobj' }
      ]
    },
    {
      text: '🔢 数学运算 (math)',
      collapsed: true,
      items: [
        { text: 'add', link: '/api/sculp-js.add' },
        { text: 'subtract', link: '/api/sculp-js.subtract' },
        { text: 'multiply', link: '/api/sculp-js.multiply' },
        { text: 'divide', link: '/api/sculp-js.divide' },
        { text: 'formatNumber', link: '/api/sculp-js.formatnumber' },
        { text: 'numberAbbr', link: '/api/sculp-js.numberabbr' }
      ]
    },
    {
      text: '🔗 URL 操作 (url)',
      collapsed: true,
      items: [
        { text: 'urlParse', link: '/api/sculp-js.urlparse' },
        { text: 'urlStringify', link: '/api/sculp-js.urlstringify' },
        { text: 'urlSetParams', link: '/api/sculp-js.urlsetparams' },
        { text: 'urlDelParams', link: '/api/sculp-js.urldelparams' },
        { text: 'URL', link: '/api/sculp-js.url' }
      ]
    },
    {
      text: '❓ 查询字符串 (qs)',
      collapsed: true,
      items: [
        { text: 'qsParse', link: '/api/sculp-js.qsparse' },
        { text: 'qsStringify', link: '/api/sculp-js.qsstringify' }
      ]
    },
    {
      text: '📁 路径操作 (path)',
      collapsed: true,
      items: [
        { text: 'pathJoin', link: '/api/sculp-js.pathjoin' },
        { text: 'pathNormalize', link: '/api/sculp-js.pathnormalize' }
      ]
    },
    {
      text: '🌐 DOM 操作 (dom)',
      collapsed: true,
      items: [
        { text: 'addClass', link: '/api/sculp-js.addclass' },
        { text: 'hasClass', link: '/api/sculp-js.hasclass' },
        { text: 'removeClass', link: '/api/sculp-js.removeclass' },
        { text: 'getStyle', link: '/api/sculp-js.getstyle' },
        { text: 'setStyle', link: '/api/sculp-js.setstyle' },
        { text: 'getComputedCSSVal', link: '/api/sculp-js.getcomputedcssval' }
      ]
    },
    {
      text: '🍪 Cookie 操作 (cookie)',
      collapsed: true,
      items: [
        { text: 'cookieGet', link: '/api/sculp-js.cookieget' },
        { text: 'cookieSet', link: '/api/sculp-js.cookieset' },
        { text: 'cookieDel', link: '/api/sculp-js.cookiedel' }
      ]
    },
    {
      text: '📋 剪贴板操作 (clipboard)',
      collapsed: true,
      items: [
        { text: 'copyText', link: '/api/sculp-js.copytext' },
        { text: 'fallbackCopyText', link: '/api/sculp-js.fallbackcopytext' }
      ]
    },
    {
      text: '⬇️ 下载功能 (download)',
      collapsed: true,
      items: [
        { text: 'downloadBlob', link: '/api/sculp-js.downloadblob' },
        { text: 'downloadURL', link: '/api/sculp-js.downloadurl' },
        { text: 'downloadData', link: '/api/sculp-js.downloaddata' },
        { text: 'downloadHref', link: '/api/sculp-js.downloadhref' },
        { text: 'crossOriginDownload', link: '/api/sculp-js.crossorigindownload' }
      ]
    },
    {
      text: '📄 文件操作 (file)',
      collapsed: true,
      items: [
        { text: 'chooseLocalFile', link: '/api/sculp-js.chooselocalfile' },
        { text: 'compressImg', link: '/api/sculp-js.compressimg' },
        { text: 'FileType', link: '/api/sculp-js.filetype' },
        { text: 'ICompressImgResult', link: '/api/sculp-js.icompressimgresult' },
        { text: 'ICompressOptions', link: '/api/sculp-js.icompressoptions' }
      ]
    },
    {
      text: '🔒 Base64 编解码 (base64)',
      collapsed: true,
      items: [
        { text: 'weBtoa', link: '/api/sculp-js.webtoa' },
        { text: 'weAtob', link: '/api/sculp-js.weatob' },
        { text: 'b64decode', link: '/api/sculp-js.b64decode' },
        { text: 'b64encode', link: '/api/sculp-js.b64encode' }
      ]
    },
    {
      text: '🎲 随机数/字符串 (random)',
      collapsed: true,
      items: [
        { text: 'randomNumber', link: '/api/sculp-js.randomnumber' },
        { text: 'randomString', link: '/api/sculp-js.randomstring' },
        { text: 'randomUUID', link: '/api/sculp-js.randomuuid' },
        { text: 'uniqueNumber', link: '/api/sculp-js.uniquenumber' },
        { text: 'uniqueString', link: '/api/sculp-js.uniquestring' },
        { text: 'uniqueSymbol', link: '/api/sculp-js.uniquesymbol' },
        { text: 'UniqueNumberSafeLength', link: '/api/sculp-js.unique_number_safe_length' }
      ]
    },
    {
      text: '⏱️ 防抖和节流函数',
      collapsed: true,
      items: [
        { text: 'debounce', link: '/api/sculp-js.debounce' },
        { text: 'throttle', link: '/api/sculp-js.throttle' },
        { text: 'once', link: '/api/sculp-js.once' },
        { text: 'DebounceFunc', link: '/api/sculp-js.debouncefunc' },
        { text: 'ThrottleFunc', link: '/api/sculp-js.throttlefunc' },
        { text: 'OnceFunc', link: '/api/sculp-js.oncefunc' }
      ]
    },
    {
      text: '⚡ 异步操作 (async)',
      collapsed: true,
      items: [
        { text: 'wait', link: '/api/sculp-js.wait' },
        { text: 'asyncMap', link: '/api/sculp-js.asyncmap' },
        { text: 'safeAwait', link: '/api/sculp-js.safeawait' }
      ]
    },
    {
      text: '🧩 函数式编程 (func)',
      collapsed: true,
      items: [
        { text: 'executeInScope', link: '/api/sculp-js.executeinscope' },
        { text: 'Fn', link: '/api/sculp-js.fn' },
        { text: 'AsyncCallback', link: '/api/sculp-js.asynccallback' },
        { text: 'PromiseFn', link: '/api/sculp-js.promisefn' }
      ]
    },
    {
      text: '💧 水印生成 (watermark)',
      collapsed: true,
      items: [
        { text: 'genCanvasWM', link: '/api/sculp-js.gencanvaswm' },
        { text: 'ICanvasWM', link: '/api/sculp-js.icanvaswm' },
        { text: 'supportCanvas', link: '/api/sculp-js.supportcanvas' }
      ]
    },
    {
      text: '🛠️ 工具和类型定义',
      collapsed: true,
      items: [
        { text: 'AnyArray', link: '/api/sculp-js.anyarray' },
        { text: 'AnyFunc', link: '/api/sculp-js.anyfunc' },
        { text: 'AnyObject', link: '/api/sculp-js.anyobject' },
        { text: 'ArrayElements', link: '/api/sculp-js.arrayelements' },
        { text: 'ChangeRequired', link: '/api/sculp-js.changerequired' },
        { text: 'ChangeRequiredExcept', link: '/api/sculp-js.changerequiredexcept' },
        { text: 'ChangeOptional', link: '/api/sculp-js.changeoptional' },
        { text: 'PartialDeep', link: '/api/sculp-js.partialdeep' },
        { text: 'LooseParams', link: '/api/sculp-js.looseparams' },
        { text: 'LooseParamValue', link: '/api/sculp-js.looseparamvalue' },
        { text: 'Params', link: '/api/sculp-js.params' },
        { text: 'Replacer', link: '/api/sculp-js.replacer' },
        { text: 'GetKey', link: '/api/sculp-js.getkey' },
        { text: 'DiffResult', link: '/api/sculp-js.diffresult' },
        { text: 'IFilterCondition', link: '/api/sculp-js.ifiltercondition' },
        { text: 'IFieldOptions', link: '/api/sculp-js.ifieldoptions' },
        { text: 'IDLike', link: '/api/sculp-js.idlike' },
        { text: 'numberToHex', link: '/api/sculp-js.numbertohex' },
        { text: 'select', link: '/api/sculp-js.select' },
        { text: 'style', link: '/api/sculp-js.style' },
        { text: 'tooltipEvent', link: '/api/sculp-js.tooltipevent' },
        { text: 'encode', link: '/api/sculp-js.unicodetoolkit.encode' },
        { text: 'decode', link: '/api/sculp-js.unicodetoolkit.decode' },
      ]
    }
  ];
};

export default defineConfig({
  lang: 'zh-CN',
  title: 'sculp-js',
  description: 'TypeScript 编写的现代 JavaScript 工具库，零依赖，支持 ESM / CJS / UMD',
  markdown: {
    lineNumbers: true
  },
  cleanUrls: true,
  lastUpdated: true,

  // GitHub Pages 路径
  base: '/sculp-js/',
  vite: {
    logLevel: 'info',
    plugins: [
      SearchPlugin({
        previewLength: 62,
        buttonLabel: '搜索',
        placeholder: '搜索文档',
        tokenize: 'full'
      })
    ]
  },
  themeConfig: {
    logo: undefined,
    siteTitle: 'sculp-js',

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },

    nav: [
      { text: '指南', link: '/guide/getting-started' },
      {
        text: 'API',
        link: '/api/index',
        activeMatch: '/api/'
      },
      {
        text: '分类',
        items: [
          {
            text: '基础类型',
            items: [
              { text: '🔍 类型判断', link: '/api/sculp-js.isstring' },
              { text: '✅ 验证器', link: '/api/sculp-js.isemail' }
            ]
          },
          {
            text: '数据处理',
            items: [
              { text: '📦 对象操作', link: '/api/sculp-js.clonedeep' },
              { text: '📋 数组操作', link: '/api/sculp-js.arrayeach' },
              { text: '🌳 树结构', link: '/api/sculp-js.foreachdeep' },
              { text: '🔤 字符串', link: '/api/sculp-js.stringcamelcase' },
              { text: '🔢 数学运算', link: '/api/sculp-js.add' }
            ]
          },
          {
            text: 'Web API',
            items: [
              { text: '🌐 DOM 操作', link: '/api/sculp-js.addclass' },
              { text: '🔗 URL 操作', link: '/api/sculp-js.urlparse' },
              { text: '📁 路径操作', link: '/api/sculp-js.pathjoin' },
              { text: '⬇️ 下载功能', link: '/api/sculp-js.downloadblob' },
              { text: '💧 水印生成', link: '/api/sculp-js.gencanvaswm' }
            ]
          },
          {
            text: '工具函数',
            items: [
              { text: '⏱️ 防抖节流', link: '/api/sculp-js.debounce' },
              { text: '⚡ 异步操作', link: '/api/sculp-js.asyncmap' },
              { text: '🎲 随机数', link: '/api/sculp-js.randomnumber' },
              { text: '📅 日期处理', link: '/api/sculp-js.formatdate' }
            ]
          }
        ]
      }
    ],

    outline: {
      level: [2, 3],
      label: '页面导航'
    },

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '开始使用', link: '/guide/getting-started' }
          ]
        }
      ],
      '/api/': generateApiSidebar()
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/chandq/sculp-js' }
    ],

    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '清除查询条件',
                backButtonTitle: '返回主菜单',
                noResultsText: '找不到相关结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '回车键',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'ESC键'
                }
              }
            }
          }
        }
      }
    },

    editLink: {
      pattern: 'https://github.com/chandq/sculp-js/edit/main/docs-site/:path',
      text: '在 GitHub 上编辑此页面'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © chandq'
    }
  }
});
