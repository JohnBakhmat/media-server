import { FileSystem, Path } from '@effect/platform';
import { BunContext, BunRuntime } from '@effect/platform-bun';
import { Effect, Sink, Stream, pipe } from 'effect';
import { parseBuffer } from 'music-metadata';
import { nanoid } from 'nanoid';
import { db } from './db/database';
import type { NewMediaFile } from './db/types';

const dir: string = '/home/john/Music/Music/';
//const dir = '/Users/johnb/Music/Music/Media.localized/Music';
const supporterExtenstions = ['m4a', 'mp3', 'flac', 'wav'] as const;

const program = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;

	const files = fs.readDirectory(dir, { recursive: true });
	const stream = pipe(
		Stream.fromIterableEffect(files),
		Stream.filter((x) => supporterExtenstions.some((ext) => x.endsWith(ext))),
		Stream.map((x) => path.resolve(dir, x)),
		Stream.flatMap((file) =>
			pipe(
				fs.stat(file),
				Effect.map((stat) => ({
					path: file,
					size: Math.round(Number(stat.size) / 1024),
				})),
			),
		),
		Stream.map(
			(x) =>
				({
					id: nanoid(),
					path: x.path,
					size: x.size,
				}) satisfies NewMediaFile,
		),
		Stream.tap(Effect.log),
		Stream.take(5),
	);

	// biome-ignore lint/complexity/noForEach: <explanation>
	const fileSink = Sink.forEach((file: NewMediaFile) =>
		pipe(
			Effect.promise(() =>
				db
					.insertInto('files')
					.values(file)
					.onConflict((c) => c.column('path').doUpdateSet({ size: file.size }))
					.execute(),
			),
			Effect.tap(Effect.log),
		),
	);

	// biome-ignore lint/complexity/noForEach: <explanation>
	const songSink = Sink.forEach((file: NewMediaFile) =>
		pipe(
			fs.readFile(file.path),
			Effect.flatMap((x) => Effect.promise(() => parseBuffer(x))),
			Effect.map((x) => ({
				title: x.common.title,
				album: x.common.album,
				artists: x.common.artists ?? [],
				albumArtist: x.common.artist,
			})),
			Effect.flatMap((x) =>
				pipe(
					Effect.promise(() =>
						db
							.insertInto('artists')
							.values(
								x.artists?.map((artist) => ({
									id: nanoid(),
									name: artist,
								})),
							)
							.onConflict((c) => c.doNothing())
							.returningAll()
							.execute(),
					),
					Effect.map((artists) =>
						artists.find((a) => a.name === x.albumArtist),
					),
					Effect.flatMap((artist) =>
						Effect.if(!!artist, {
							onTrue: () => Effect.try(() => artist?.id ?? ''),
							onFalse: () =>
								Effect.promise(() =>
									db
										.insertInto('artists')
										.values({
											name: x.albumArtist ?? nanoid(),
										})
										.onConflict((c) => c.doNothing())
										.returning(['id'])
										.execute(),
								),
						}),
					),
				),
			),
			Effect.tap(Effect.log),
		),
	);

	yield* Stream.run(stream, Sink.zip(fileSink, songSink, { concurrent: true }));
});

BunRuntime.runMain(program.pipe(Effect.provide(BunContext.layer)));
