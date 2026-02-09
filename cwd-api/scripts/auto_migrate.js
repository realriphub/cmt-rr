const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findDatabaseName() {
	const files = ['wrangler.jsonc', 'wrangler.toml'];
	const baseDirs = [process.cwd(), path.resolve(__dirname, '..')];
	for (const base of baseDirs) {
		for (const file of files) {
			const filePath = path.join(base, file);
			if (!fs.existsSync(filePath)) {
				continue;
			}
			const content = fs.readFileSync(filePath, 'utf-8');
			if (file.endsWith('.jsonc')) {
				const jsonMatch = content.match(/"database_name"\s*:\s*["'](.*?)["']/);
				if (jsonMatch) {
					return jsonMatch[1];
				}
			} else {
				const chunks = content.split('[[d1_databases]]');
				for (const chunk of chunks) {
					if (chunk.includes('CWD_DB') || chunk.includes('"CWD_DB"')) {
						const nameMatch = chunk.match(/database_name\s*=\s*["'](.*?)["']/);
						if (nameMatch) {
							return nameMatch[1];
						}
					}
				}
				const match = content.match(/database_name\s*=\s*["'](.*?)["']/);
				if (match) {
					return match[1];
				}
			}
		}
	}
	return null;
}

function run() {
	try {
		console.log('🔍 [Auto-Migrate] Detecting D1 database...');
		const dbName = findDatabaseName();
		if (!dbName) {
			console.warn('⚠️ [Auto-Migrate] Could not detect database_name from wrangler config. Skipping.');
			return;
		}
        console.log(`✅ [Auto-Migrate] Found database: ${dbName}`);

        console.log('🔍 [Auto-Migrate] Checking schema status...');
        try {
            // Check if post_url column exists
            const checkCmd = `npx wrangler d1 execute ${dbName} --command "SELECT count(*) as count FROM pragma_table_info('Comment') WHERE name='post_url'" --remote --json`;
            const output = execSync(checkCmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
            
            const result = JSON.parse(output);
            const count = result[0]?.results?.[0]?.count;
            
            if (count > 0) {
                console.log('✅ [Auto-Migrate] Schema is up to date.');
                return;
            }
        } catch (e) {
            console.warn('⚠️ [Auto-Migrate] Check failed (Database might be new or network error). Skipping migration to be safe.');
            console.warn(e.message);
            return;
        }

        console.log('🚀 [Auto-Migrate] Applying migration...');
        const sql = `
            ALTER TABLE Comment ADD COLUMN post_url TEXT;
            UPDATE Comment SET post_url = post_slug;
            UPDATE Comment 
            SET post_slug = SUBSTR(
              REPLACE(REPLACE(post_slug, 'https://', ''), 'http://', ''),
              INSTR(REPLACE(REPLACE(post_slug, 'https://', ''), 'http://', ''), '/')
            )
            WHERE post_slug LIKE 'http%' AND INSTR(REPLACE(REPLACE(post_slug, 'https://', ''), 'http://', ''), '/') > 0;
        `;
        
        const flatSql = sql.replace(/\s+/g, ' ').trim();
        const migrateCmd = `npx wrangler d1 execute ${dbName} --command "${flatSql}" --remote --yes`;
        
        execSync(migrateCmd, { stdio: 'inherit' });
        console.log('✅ [Auto-Migrate] Completed successfully.');

    } catch (error) {
        console.error('❌ [Auto-Migrate] Failed:', error.message);
        process.exit(1);
    }
}

run();
