import * as fs from "fs/promises";

let [author, gamePrompt] = (process.argv[2] ?? "").split(":");
// verify the gameprompt name, to not break class minigame //
gamePrompt = gamePrompt.replace(/[\s_\-\.]/g, "");

if (!author || !gamePrompt) {
	console.error("Must specify author and game name");
	console.error("$ npm run create {author}:{game}");
	process.exit(1);
}

const author_dir = `games/${author}`;
const game_dir = `games/${author}`;
const file_path = `games/${author}/${gamePrompt}.ts`;
const assets_dir = `${author_dir}/assets/`;

const template = `
import { Minigame } from "../../src/game/types";

const ${gamePrompt}Game: Minigame = {
	author: "${author}",
	prompt: "${gamePrompt.toUpperCase() + "!"}",
	input: "keys",
	duration: 4,
	urlPrefix: "${assets_dir}",
	load(ctx) {},
	start(ctx) {
		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(),
		]);
	},
};

export default ${gamePrompt}Game;
`.trim();

const isDir = (path) =>
	fs
		.stat(path)
		.then((stat) => stat.isDirectory())
		.catch(() => false);

if (await isDir(file_path)) {
	console.error(`Game already exists at "${file_path}"!`);
	process.exit(1);
}

await fs.mkdir(game_dir, { recursive: true }); // makes the actual game dir
await fs.mkdir(assets_dir, { recursive: true }); // makes the assets dir
await fs.writeFile(`${file_path}`, template); // writes the template code to game.ts

console.log(`Game created at ${file_path}!`);
