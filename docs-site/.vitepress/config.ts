import { defineConfig } from 'vitepress';
import { SearchPlugin } from 'vitepress-plugin-search'

// 动态生成 API 侧边栏
const generateApiSidebar = () => {
  return [
    {
      text: 'API 总览',
      items: [
        { text: '目录', link: '/api/index' },
        { text: 'sculp-js（总览）', link: '/api/sculp-js' }
      ]
    },
    {
      text: '类型判断 (type)',
      collapsible: true,
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
        { text: 'typeIs', link: '/api/sculp-js.typeis' }
      ]
    },
    {
      text: '验证器 (validator)',
      collapsible: true,
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
      text: '数组操作 (array)',
      collapsible: true,
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
      text: '异步操作 (async)',
      collapsible: true,
      items: [
        { text: 'wait', link: '/api/sculp-js.wait' },
        { text: 'asyncMap', link: '/api/sculp-js.asyncmap' },
        { text: 'safeAwait', link: '/api/sculp-js.safeawait' }
      ]
    },
    {
      text: 'Base64 编解码 (base64)',
      collapsible: true,
      items: [
        { text: 'weBtoa', link: '/api/sculp-js.webtoa' },
        { text: 'weAtob', link: '/api/sculp-js.weatob' },
        { text: 'b64decode', link: '/api/sculp-js.b64decode' },
        { text: 'b64encode', link: '/api/sculp-js.b64encode' }
      ]
    },
    {
      text: 'DOM 操作 (dom)',
      collapsible: true,
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
      text: 'Cookie 操作 (cookie)',
      collapsible: true,
      items: [
        { text: 'cookieGet', link: '/api/sculp-js.cookieget' },
        { text: 'cookieSet', link: '/api/sculp-js.cookieset' },
        { text: 'cookieDel', link: '/api/sculp-js.cookiedel' }
      ]
    },
    {
      text: '日期处理 (date)',
      collapsible: true,
      items: [
        { text: 'formatDate', link: '/api/sculp-js.formatdate' },
        { text: 'calculateDate', link: '/api/sculp-js.calculatedate' },
        { text: 'calculateDateTime', link: '/api/sculp-js.calculatedatetime' },
        { text: 'dateParse', link: '/api/sculp-js.dateparse' },
        { text: 'dateToStart', link: '/api/sculp-js.datetostart' },
        { text: 'dateToEnd', link: '/api/sculp-js.datetoend' },
        { text: 'DateValue', link: '/api/sculp-js.datevalue' },
        { text: 'DateObj', link: '/api/sculp-js.dateobj' }
      ]
    },
    {
      text: '对象操作 (object)',
      collapsible: true,
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
      text: '树结构操作 (tree)',
      collapsible: true,
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
      text: '数学运算 (math)',
      collapsible: true,
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
      text: '字符串操作 (string)',
      collapsible: true,
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
      text: 'URL 操作 (url)',
      collapsible: true,
      items: [
        { text: 'urlParse', link: '/api/sculp-js.urlparse' },
        { text: 'urlStringify', link: '/api/sculp-js.urlstringify' },
        { text: 'urlSetParams', link: '/api/sculp-js.urlsetparams' },
        { text: 'urlDelParams', link: '/api/sculp-js.urldelparams' },
        { text: 'URL', link: '/api/sculp-js.url' }
      ]
    },
    {
      text: '路径操作 (path)',
      collapsible: true,
      items: [
        { text: 'pathJoin', link: '/api/sculp-js.pathjoin' },
        { text: 'pathNormalize', link: '/api/sculp-js.pathnormalize' }
      ]
    },
    {
      text: '剪贴板操作 (clipboard)',
      collapsible: true,
      items: [
        { text: 'copyText', link: '/api/sculp-js.copytext' },
        { text: 'fallbackCopyText', link: '/api/sculp-js.fallbackcopytext' }
      ]
    },
    {
      text: '下载功能 (download)',
      collapsible: true,
      items: [
        { text: 'downloadBlob', link: '/api/sculp-js.downloadblob' },
        { text: 'downloadURL', link: '/api/sculp-js.downloadurl' },
        { text: 'downloadData', link: '/api/sculp-js.downloaddata' },
        { text: 'downloadHref', link: '/api/sculp-js.downloadhref' },
        { text: 'crossOriginDownload', link: '/api/sculp-js.crossorigindownload' }
      ]
    },
    {
      text: '文件操作 (file)',
      collapsible: true,
      items: [
        { text: 'chooseLocalFile', link: '/api/sculp-js.chooselocalfile' },
        { text: 'compressImg', link: '/api/sculp-js.compressimg' },
        { text: 'FileType', link: '/api/sculp-js.filetype' },
        { text: 'ICompressImgResult', link: '/api/sculp-js.icompressimgresult' },
        { text: 'ICompressOptions', link: '/api/sculp-js.icompressoptions' }
      ]
    },
    {
      text: '随机数/字符串 (random)',
      collapsible: true,
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
      text: '防抖和节流函数',
      collapsible: true,
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
      text: '函数式编程 (func)',
      collapsible: true,
      items: [
        { text: 'executeInScope', link: '/api/sculp-js.executeinscope' },
        { text: 'Fn', link: '/api/sculp-js.fn' },
        { text: 'AsyncCallback', link: '/api/sculp-js.asynccallback' },
        { text: 'PromiseFn', link: '/api/sculp-js.promisefn' }
      ]
    },
    {
      text: '查询字符串 (qs)',
      collapsible: true,
      items: [
        { text: 'qsParse', link: '/api/sculp-js.qsparse' },
        { text: 'qsStringify', link: '/api/sculp-js.qsstringify' }
      ]
    },
    {
      text: '水印生成 (watermark)',
      collapsible: true,
      items: [
        { text: 'genCanvasWM', link: '/api/sculp-js.gencanvaswm' },
        { text: 'ICanvasWM', link: '/api/sculp-js.icanvaswm' },
        { text: 'supportCanvas', link: '/api/sculp-js.supportcanvas' }
      ]
    },
    {
      text: '工具和类型定义',
      collapsible: true,
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
        { text: 'getGlobal', link: '/api/sculp-js.getglobal' },
        { text: 'setGlobal', link: '/api/sculp-js.setglobal' },
        { text: 'select', link: '/api/sculp-js.select' },
        { text: 'style', link: '/api/sculp-js.style' },
        { text: 'tooltipEvent', link: '/api/sculp-js.tooltipevent' }
      ]
    }
  ];
};

export default defineConfig({
  lang: 'zh-CN',
  title: 'sculp-js',
  description: 'Utils function library for modern JavaScript/TypeScript',
  markdown: {
    lineNumbers: true
  },
  cleanUrls: true,
  lastUpdated: true,

  // GitHub Pages 路径，如需自定义域名/路径，可修改 base
  base: '/sculp-js/',
  vite: {
    logLevel: 'info',

    plugins: [
      SearchPlugin({
        // 启用预览片段（显示匹配内容的部分文本）
        previewLength: 62,
        // 按钮标签
        buttonLabel: '搜索',
        // 占位符
        placeholder: '搜索文档',
        // 允许模糊搜索
        tokenize: 'full'
      })
    ]
  },
  themeConfig: {
    lastUpdated: {
      text: 'Last updated',
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
            text: '类型判断',
            link: '/api/sculp-js.isstring'
          },
          {
            text: '数组操作',
            link: '/api/sculp-js.arrayeach'
          },
          {
            text: '异步操作',
            link: '/api/sculp-js.asyncmap'
          },
          {
            text: 'DOM 操作',
            link: '/api/sculp-js.addclass'
          }
        ]
      }
    ],
    outline: [2, 3],
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
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © chandq'
    }
  }
});
