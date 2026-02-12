import { AwsClient } from 'aws4fetch';

export interface S3Config {
	endpoint: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	region?: string;
}

export interface S3Object {
	key: string;
	size: number;
	lastModified: string;
}

export class S3Client {
	private client: AwsClient;
	private bucket: string;
	private endpoint: string;

	constructor(config: S3Config) {
		this.client = new AwsClient({
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
			region: config.region || 'auto',
			service: 's3',
		});
		this.bucket = config.bucket;
		// Ensure endpoint doesn't have trailing slash
		this.endpoint = config.endpoint.replace(/\/$/, '');
	}

	async putObject(key: string, body: string | Uint8Array | Blob) {
		const url = `${this.endpoint}/${this.bucket}/${key}`;
		// Some S3 compatible storages need path style access
		// If endpoint is like https://s3.amazonaws.com, it might need virtual host style
		// But for broad compatibility (MinIO, R2, etc.), path style is often safer if endpoint is custom.
		// However, aws4fetch handles signing.

		// Let's try to construct URL carefully.
		// If endpoint includes bucket in hostname, we shouldn't add it to path.
		// But assuming user provides a generic endpoint (e.g. https://<account>.r2.cloudflarestorage.com)
		// We will append bucket to path: https://<endpoint>/<bucket>/<key>

		const res = await this.client.fetch(url, {
			method: 'PUT',
			body,
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`S3 Upload Failed: ${res.status} ${res.statusText} - ${text}`);
		}

		return res;
	}

	async listObjects(prefix?: string): Promise<S3Object[]> {
		let url = `${this.endpoint}/${this.bucket}?list-type=2`;
		if (prefix) {
			url += `&prefix=${encodeURIComponent(prefix)}`;
		}

		const res = await this.client.fetch(url, {
			method: 'GET',
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`S3 List Failed: ${res.status} ${res.statusText} - ${text}`);
		}

		const xml = await res.text();
		return this.parseListObjectsXml(xml);
	}

	async deleteObject(key: string): Promise<void> {
		const url = `${this.endpoint}/${this.bucket}/${key}`;
		const res = await this.client.fetch(url, {
			method: 'DELETE',
		});

		if (!res.ok && res.status !== 204) {
			const text = await res.text();
			throw new Error(`S3 Delete Failed: ${res.status} ${res.statusText} - ${text}`);
		}
	}

	async getObject(key: string): Promise<Response> {
		const url = `${this.endpoint}/${this.bucket}/${key}`;
		const res = await this.client.fetch(url, {
			method: 'GET',
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`S3 Get Failed: ${res.status} ${res.statusText} - ${text}`);
		}

		return res;
	}

	private parseListObjectsXml(xml: string): S3Object[] {
		const objects: S3Object[] = [];
		const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
		let match;

		while ((match = contentsRegex.exec(xml)) !== null) {
			const content = match[1];
			const keyMatch = content.match(/<Key>([^<]*)<\/Key>/);
			const sizeMatch = content.match(/<Size>(\d+)<\/Size>/);
			const lastModifiedMatch = content.match(/<LastModified>([^<]*)<\/LastModified>/);

			if (keyMatch && sizeMatch && lastModifiedMatch) {
				objects.push({
					key: keyMatch[1],
					size: parseInt(sizeMatch[1], 10),
					lastModified: lastModifiedMatch[1],
				});
			}
		}

		return objects.sort((a, b) =>
			new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
		);
	}
}
