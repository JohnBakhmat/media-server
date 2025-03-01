import { readdir } from 'node:fs/promises';
import { FileSystem, Path } from '@effect/platform';
import { BunContext, BunRuntime } from '@effect/platform-bun';
import { Effect, Logger, Queue, Sink, Stream, pipe } from 'effect';
import { nanoid } from 'nanoid';
import { db } from './db/database';
import type { MediaFile, NewMediaFile } from './db/types';
import { parseBuffer } from 'music-metadata';

// const dir: string = "/home/john/Music/Music/";
const dir = '/Users/johnb/Music/Music/Media.localized/Music';
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
	);

	// biome-ignore lint/complexity/noForEach: <explanation>
	const fileSink = Sink.forEach((file: NewMediaFile) =>
		Effect.promise(() =>
			db
				.insertInto('files')
				.values(file)
				.onConflict((c) => c.column('path').doUpdateSet({ size: file.size }))
				.execute(),
		),
	);

	yield* Stream.run(stream, fileSink);

	const file_path =
		'/Users/johnb/Music/Music/Media.localized/Music/Foster the People/Torches X (Deluxe Edition)/08 Life on the Nickel.m4a';
	const file = yield* fs.readFile(file_path);
	const meta = yield* Effect.promise(() => parseBuffer(file));
	const { title, album, artists, genre } = meta.common;
	console.dir({ title, album, artists, genre });
});

BunRuntime.runMain(program.pipe(Effect.provide(BunContext.layer)));
