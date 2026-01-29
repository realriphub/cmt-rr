import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import LayoutView from '../views/LayoutView.vue';
import CommentsView from '../views/CommentsView.vue';
import SettingsView from '../views/SettingsView.vue';
import DataView from '../views/DataView.vue';
import StatsView from '../views/StatsView.vue';
import AnalyticsVisitView from '../views/AnalyticsVisitView.vue';

const routes: RouteRecordRaw[] = [
	{
		path: '/login',
		name: 'login',
		component: LoginView,
	},
	{
		path: '/',
		component: LayoutView,
		children: [
			{
				path: '',
				redirect: '/comments',
			},
			{
				path: 'comments',
				name: 'comments',
				component: CommentsView,
				meta: {
					title: '评论管理',
				},
			},
			{
				path: 'stats',
				name: 'stats',
				component: StatsView,
				meta: {
					title: '数据看板',
				},
			},
			{
				path: 'analytics',
				name: 'analytics',
				component: AnalyticsVisitView,
				meta: {
					title: '访问统计',
				},
			},
			{
				path: 'settings',
				name: 'settings',
				component: SettingsView,
				meta: {
					title: '网站设置',
				},
			},
			{
				path: 'data',
				name: 'data',
				component: DataView,
				meta: {
					title: '数据管理',
				},
			},
		],
	},
];

export const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach((to, from, next) => {
	const defaultTitle = 'CWD 评论系统';
	if (to.meta && to.meta.title) {
		document.title = (to.meta.title + ' - ' + defaultTitle) as string;
	} else {
		document.title = defaultTitle as string;
	}
	if (to.name === 'login') {
		next();
		return;
	}
	const token = localStorage.getItem('cwd_admin_token');
	if (!token) {
		next({ name: 'login' });
		return;
	}
	next();
});

router.afterEach((to, from) => {
	if (to.name !== from.name) {
		const layoutContent = document.querySelector('.layout-content');
		if (layoutContent instanceof HTMLElement) {
			layoutContent.scrollTop = 0;
		}
		window.scrollTo(0, 0);
	}
});
