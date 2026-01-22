import nav from './configs/nav';
import { rootSidebar, apiSidebar } from './configs/sidebar';
import { defineConfig } from 'vitepress';

export default defineConfig({
	title: 'CWD 评论系统文档',
	description: '基于 Cloudflare Workers 与全球边缘网络的免服务器、极速安全、即插即用评论系统。',
	lang: 'zh-CN',
	head: [
		[
			'link',
			{
				rel: 'icon',
				href: 'https://cwd.js.org/icon.png',
			},
		],
	],
	themeConfig: {
		nav,
		sidebar: {
			'/': rootSidebar,
			'/api/': apiSidebar,
		},
		outline: {
			level: [2, 3],
			label: 'On this page',
		},
		editLink: {
			pattern: 'https://github.com/anghunk/cwd/blob/main/docs/:path',
			text: '在 GitHub 上编辑此页面',
		},
		socialLinks: [{ icon: 'github', link: 'https://github.com/anghunk/cwd' }],

		lastUpdated: true,
		lastUpdatedText: '最后更新于',
		footer: {
			message: '基于 Cloudflare Workers 构建',
			copyright: 'Copyright © 2026',
		},
		search: {
			provider: 'local',
			options: {
				locales: {
					zh: {
						translations: {
							button: {
								buttonText: '搜索文档',
								buttonAriaLabel: '搜索文档',
							},
							modal: {
								noResultsText: '无法找到相关结果',
								resetButtonTitle: '清除查询条件',
								footer: {
									selectText: '选择',
									navigateText: '切换',
								},
							},
						},
					},
				},
			},
		},
	},
});
