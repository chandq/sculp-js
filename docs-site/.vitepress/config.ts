import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'sculp-js',
  description: 'Utils function library for modern JavaScript/TypeScript',
  cleanUrls: true,

  // GitHub Pages 路径，如需自定义域名/路径，可修改 base
  base: '/sculp-js/',

  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/index' }
    ],
    outline: [2, 3],
    sidebar: {
      '/guide/': [{ text: '指南', items: [{ text: '开始使用', link: '/guide/getting-started' }] }],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: '目录', link: '/api/index' },
            { text: 'sculp-js（总览）', link: '/api/sculp-js' }
          ]
        }
      ]
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/chandq/sculp-js' }],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © chandq'
    }
  }
});

