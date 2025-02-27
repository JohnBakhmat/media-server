import type { Kysely } from "kysely";
import { sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("files")
		.addColumn("id", "text", (col) => col.primaryKey())
		.addColumn("path", "text", (col) => col.notNull().unique())
		.addColumn("size", "numeric", (col) => col.defaultTo(0))
		.addColumn("created_at", "timestamp", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.execute();
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("files").execute();
}
