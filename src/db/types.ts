import type { Selectable } from "kysely";
import type { Updateable } from "kysely";
import type { Insertable } from "kysely";
import type { ColumnType } from "kysely";
import type { Generated } from "kysely";

export type Database = {
	files: MediaFileTable;
};

export type MediaFileTable = {
	id: Generated<string>;

	path: string;
	size: number;

	created_at: ColumnType<Date, string | undefined, never>;
};

export type MediaFile = Selectable<MediaFileTable>;
export type NewMediaFile = Insertable<MediaFileTable>;
export type MediaFileUpdate = Updateable<MediaFileTable>;
