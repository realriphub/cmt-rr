import { Context } from 'hono';
import { Bindings } from '../../bindings';

type StatusCounts = {
	total: number;
	approved: number;
	pending: number;
	rejected: number;
};

type DomainCounts = StatusCounts & {
	domain: string;
};

function extractDomain(source: string | null | undefined): string | null {
	if (!source) {
		return null;
	}
	const value = source.trim();
	if (!value) {
		return null;
	}
	if (!/^https?:\/\//i.test(value)) {
		return null;
	}
	try {
		const url = new URL(value);
		return url.hostname.toLowerCase();
	} catch {
		return null;
	}
}

export const getStats = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const summaryRow = await c.env.CWD_DB.prepare(
			"SELECT COUNT(*) as total, SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected FROM Comment"
		).first<{
			total: number | null;
			approved: number | null;
			pending: number | null;
			rejected: number | null;
		}>();

		const summary: StatusCounts = {
			total: summaryRow?.total || 0,
			approved: summaryRow?.approved || 0,
			pending: summaryRow?.pending || 0,
			rejected: summaryRow?.rejected || 0
		};

		const { results } = await c.env.CWD_DB.prepare(
			'SELECT post_slug, url, status FROM Comment'
		).all<{
			post_slug: string;
			url: string | null;
			status: string;
		}>();

		const domainMap = new Map<string, StatusCounts>();

		for (const row of results) {
			const domain =
				extractDomain(row.post_slug) || extractDomain(row.url) || 'unknown';

			let counts = domainMap.get(domain);
			if (!counts) {
				counts = {
					total: 0,
					approved: 0,
					pending: 0,
					rejected: 0
				};
				domainMap.set(domain, counts);
			}
			counts.total += 1;
			if (row.status === 'approved') {
				counts.approved += 1;
			} else if (row.status === 'pending') {
				counts.pending += 1;
			} else if (row.status === 'rejected') {
				counts.rejected += 1;
			}
		}

		const domains: DomainCounts[] = Array.from(domainMap.entries())
			.map(([domain, counts]) => ({
				domain,
				total: counts.total,
				approved: counts.approved,
				pending: counts.pending,
				rejected: counts.rejected
			}))
			.sort((a, b) => b.total - a.total);

		const now = Date.now();
		const thirtyDaysAgo = now - 29 * 24 * 60 * 60 * 1000;

		const { results: dailyRows } = await c.env.CWD_DB.prepare(
			"SELECT date(created / 1000, 'unixepoch') as day, COUNT(*) as total FROM Comment WHERE created >= ? GROUP BY day ORDER BY day ASC"
		)
			.bind(thirtyDaysAgo)
			.all<{ day: string; total: number }>();

		const dailyMap = new Map<string, number>();
		for (const row of dailyRows) {
			if (row && row.day) {
				dailyMap.set(row.day, row.total || 0);
			}
		}

		const last7Days: { date: string; total: number }[] = [];
		for (let i = 29; i >= 0; i--) {
			const d = new Date(now - i * 24 * 60 * 60 * 1000);
			const year = d.getUTCFullYear();
			const month = String(d.getUTCMonth() + 1).padStart(2, '0');
			const day = String(d.getUTCDate()).padStart(2, '0');
			const key = `${year}-${month}-${day}`;
			last7Days.push({
				date: key,
				total: dailyMap.get(key) || 0
			});
		}

		return c.json({
			summary,
			domains,
			last7Days
		});
	} catch (e: any) {
		return c.json({ message: e.message || '获取统计数据失败' }, 500);
	}
};
