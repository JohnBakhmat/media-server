import type { Kysely } from 'kysely';
import { sql } from 'kysely';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('artists')
		.addColumn('id', 'text', (x) => x.primaryKey())
		.addColumn('name', 'text', (x) => x.unique())
		.execute();

	await db.schema
		.createTable('albums')
		.addColumn('id', 'text', (x) => x.primaryKey())
		.addColumn('title', 'text')
		.addColumn('artist_id', 'text', (x) =>
			x.references('artists.id').onDelete('cascade'),
		)
		.execute();

	await db.schema
		.createTable('songs')
		.addColumn('id', 'text', (x) => x.primaryKey())
		.addColumn('title', 'text')
		.addColumn('album_id', 'text', (x) =>
			x.references('albums.id').onDelete('cascade'),
		)
		.execute();

	await db.schema
		.createTable('songs_artists')
		.addColumn('id', 'text', (x) => x.primaryKey())
		.addColumn('song_id', 'text', (x) =>
			x.references('songs.id').onDelete('cascade'),
		)
		.addColumn('artist_id', 'text', (x) =>
			x.references('artists.id').onDelete('cascade'),
		)
		.addUniqueConstraint('song_artist_constraint', ['artist_id', 'song_id'])
		.execute();
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('songs').execute();
	await db.schema.dropTable('artists').execute();
	await db.schema.dropTable('albums').execute();
	await db.schema.dropTable('songs_artists').execute();
}
