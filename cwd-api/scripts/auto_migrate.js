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
		const dbName = findDatabaseName();
		if (!dbName) {
			return;
		}
        try {
            const checkCmd = `npx wrangler d1 execute ${dbName} --command "SELECT count(*) as count FROM pragma_table_info('Comment') WHERE name='post_url'" --remote --json`;
            const output = execSync(checkCmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
            
            const result = JSON.parse(output);
            const count = result[0]?.results?.[0]?.count;
            
            if (count > 0) {
                return;
            }
        } catch (e) {
            return;
        }

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
        console.log('[Auto-Migrate] Migration applied for Comment.post_url.');

    } catch (error) {
        console.error('[Auto-Migrate] Failed:', error.message);
        process.exit(1);
    }
}

run();
