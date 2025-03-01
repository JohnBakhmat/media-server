import { Database as SqliteDatabase } from 'bun:sqlite';
import { default as fs } from 'node:fs/promises';
import { default as path } from 'node:path';
import { FileMigrationProvider, Kysely, Migrator } from 'kysely';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import { down } from './migrations/create_files_table';
import type { Database } from './types';

export const dialect = new BunSqliteDialect({
	database: new SqliteDatabase('db.sqlite'),
});

const _db = new Kysely<Database>({
	dialect,
});

const migrator = new Migrator({
	db: _db,
	provider: new FileMigrationProvider({
		fs,
		path,
		migrationFolder: path.join(__dirname, './migrations'),
	}),
});

const migrate = async () => {
	const { error, results } = await migrator.migrateToLatest();

	if (!results) return;

	for (const m of results) {
		if (m.status === 'Success') {
			console.log(`migration "${m.migrationName}" was executed successfully`);
		} else if (m.status === 'Error') {
			console.error(`failed to execute migration "${m.migrationName}"`);
		}
	}

	if (error) {
		console.error('failed to migrate');
		console.error(error);
		process.exit(1);
	}
};

await migrate();

export const db = _db;
