import type { Context } from 'hono';
import type { Bindings } from '../../bindings';

export const getPagePv = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const rawPostSlug = c.req.query('post_slug') || '';
		const postSlug = rawPostSlug.trim();
		const rawSiteId = c.req.query('siteId') || '';
		const siteId = rawSiteId && rawSiteId !== 'default' ? rawSiteId : '';

		if (!postSlug) {
			return c.json({ message: 'post_slug is required' }, 400);
		}

		const row = await c.env.CWD_DB.prepare(
			'SELECT pv FROM page_stats WHERE post_slug = ? AND site_id = ?'
		)
			.bind(postSlug, siteId)
			.first<{ pv: number }>();

		const pv = row?.pv || 0;

		return c.json({ pv, postSlug });
	} catch (e: any) {
		return c.json({ message: e.message || '获取访问量失败' }, 500);
	}
};