import type { Selectable } from 'kysely';
import type { Updateable } from 'kysely';
import type { Insertable } from 'kysely';
import type { ColumnType } from 'kysely';
import type { Generated } from 'kysely';

export type Database = {
	files: MediaFileTable;
	songs: SongTable;
	artists: ArtistTable;
	song_artist: SongArtistTable;
	album: AlbumTable;
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

export type ArtistTable = {
	id: Generated<string>;
	name: string;
};

export type Artist = Selectable<ArtistTable>;
export type NewArtist = Insertable<ArtistTable>;
export type ArtistUpdate = Updateable<ArtistTable>;

export type AlbumTable = {
	id: Generated<string>;
	title: string;
	artist_id: string;
};

export type Album = Selectable<AlbumTable>;
export type NewAlbum = Insertable<AlbumTable>;
export type AlbumUpdate = Updateable<AlbumTable>;

export type SongTable = {
	id: Generated<string>;
	title: string;
	album_id: string;
};

export type Song = Selectable<SongTable>;
export type NewSong = Insertable<SongTable>;
export type SongUpdate = Updateable<SongTable>;

export type SongArtistTable = {
	id: Generated<string>;
	artist_id: string;
	song_id: string;
};

export type SongArtist = Selectable<SongArtistTable>;
export type NewSongArtist = Insertable<SongArtistTable>;
export type SongArtistUpdate = Updateable<SongArtistTable>;
