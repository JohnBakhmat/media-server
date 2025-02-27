import { readdir } from "node:fs/promises";
import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Logger, Queue, Sink, Stream, pipe } from "effect";
import { nanoid } from "nanoid";
import { db } from "./db/database";
import type { MediaFile, NewMediaFile } from "./db/types";

const dir: string = "/Users/johnb/music/Music/Media.localized/Music/";

const program = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;

	const files = fs.readDirectory(dir, { recursive: true });
	const stream = pipe(
		Stream.fromIterableEffect(files),
		Stream.filter((x) => x.endsWith("m4a")),
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
	const sink = Sink.forEach((file: NewMediaFile) =>
		Effect.promise(() =>
			db
				.insertInto("files")
				.values(file)
				.onConflict((c) => c.column("path").doUpdateSet({ size: file.size }))
				.execute(),
		),
	);

	yield* Stream.run(stream, sink);
});

BunRuntime.runMain(program.pipe(Effect.provide(BunContext.layer)));
