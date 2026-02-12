import { Context } from 'hono';
import { Bindings } from '../../bindings';
import { loadS3Settings } from '../../utils/s3Settings';
import { S3Client } from '../../utils/s3';
import { getConfigs } from './exportConfig';
import { getStatsData } from './exportStats';

async function getS3Client(c: Context<{ Bindings: Bindings }>): Promise<{ s3: S3Client; settings: any } | Response> {
	const settings = await loadS3Settings(c.env);
	if (!settings.endpoint || !settings.bucket || !settings.accessKeyId || !settings.secretAccessKey) {
		return c.json({ message: 'S3 配置不完整，请先配置 S3 信息' }, 400);
	}
	const s3 = new S3Client({
		endpoint: settings.endpoint,
		accessKeyId: settings.accessKeyId,
		secretAccessKey: settings.secretAccessKey,
		bucket: settings.bucket,
		region: settings.region,
	});
	return { s3, settings };
}

export async function triggerS3Backup(c: Context<{ Bindings: Bindings }>) {
	try {
		// 1. Load S3 Settings
		const result = await getS3Client(c);
		if (result instanceof Response) return result;
		const { s3 } = result;

		// 2. Gather Backup Data (Logic from exportBackup.ts)
		const { results: comments } = await c.env.CWD_DB.prepare('SELECT * FROM Comment ORDER BY priority DESC, created DESC').all();
		const configs = await getConfigs(c.env);
		const stats = await getStatsData(c.env);

		const backupData = {
			version: '1.0',
			timestamp: Date.now(),
			comments: comments,
			settings: configs,
			page_stats: stats.page_stats,
			page_visit_daily: stats.page_visit_daily,
			likes: stats.likes,
		};

		const jsonString = JSON.stringify(backupData, null, 2);
		const dateStr = new Date().toISOString().split('T')[0];
		const fileName = `cwd-backup-${dateStr}-${Date.now()}.json`;

		// 3. Upload to S3
		await s3.putObject(fileName, jsonString);

		return c.json({
			message: '备份成功',
			file: fileName,
		});
	} catch (e: any) {
		console.error('S3 Backup Error:', e);
		return c.json({ message: e.message || 'S3 备份失败' }, 500);
	}
}

export async function listS3Backups(c: Context<{ Bindings: Bindings }>) {
	try {
		const result = await getS3Client(c);
		if (result instanceof Response) return result;
		const { s3 } = result;

		const files = await s3.listObjects('cwd-backup-');
		return c.json({ files });
	} catch (e: any) {
		console.error('S3 List Backups Error:', e);
		return c.json({ message: e.message || '获取备份列表失败' }, 500);
	}
}

export async function deleteS3BackupHandler(c: Context<{ Bindings: Bindings }>) {
	try {
		const key = c.req.query('key');
		if (!key) {
			return c.json({ message: '缺少 key 参数' }, 400);
		}

		const result = await getS3Client(c);
		if (result instanceof Response) return result;
		const { s3 } = result;

		await s3.deleteObject(key);
		return c.json({ message: '删除成功' });
	} catch (e: any) {
		console.error('S3 Delete Backup Error:', e);
		return c.json({ message: e.message || '删除备份失败' }, 500);
	}
}

export async function downloadS3BackupHandler(c: Context<{ Bindings: Bindings }>) {
	try {
		const key = c.req.query('key');
		if (!key) {
			return c.json({ message: '缺少 key 参数' }, 400);
		}

		const result = await getS3Client(c);
		if (result instanceof Response) return result;
		const { s3 } = result;

		const s3Response = await s3.getObject(key);
		const body = await s3Response.arrayBuffer();

		// Set headers for file download
		c.header('Content-Type', 'application/json');
		c.header('Content-Disposition', `attachment; filename="${key}"`);
		c.header('Content-Length', String(body.byteLength));

		return c.body(body);
	} catch (e: any) {
		console.error('S3 Download Backup Error:', e);
		return c.json({ message: e.message || '下载备份失败' }, 500);
	}
}
