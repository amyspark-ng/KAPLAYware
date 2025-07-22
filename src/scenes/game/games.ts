import { Microgame } from "../../types/Microgame";
import { getGameID } from "./utils";

window.microgames = [];

// TODO: ASSET REFACTORING
/*
 * have to make it so each minigame asset is properly loaded (may have to change a buncha of the loadSprite code)
 * how do games that are not built in work?
 * get the code below properly working
 * fix the function thing that creates a new minigame
 */

export const modules = import.meta.glob("../../../games/*/*/main.ts", { eager: true });

const exclude = new Set([]);

/** The imported games */
const games = Object.values(modules)
	.map((module: any) => module.default)
	.filter((game) => !exclude.has(getGameID(game))) as Microgame[];

// TODO: Find a better place for this
for (const g of games) {
	if (!g.isBoss) g.isBoss = false;
}

// Mod testing
const testMods = ["/mods/microgames/lajbel/avoid"];

for (const mod of testMods) {
	// This is indeed for fetching the actual URL from the web, no from static
	// file generation.

	/* @vite-ignore */
	import(`${mod}/main.js`).then((minigame) => {
		// window.microgames.push(minigame.default);
	}).catch(() => {
		console.error(`Error loading ${mod} microgame.`);
	});
}

const onlyInclude = new Set([
	window.DEV_MICROGAME, // Passed arg from npm run dev {yourname}:{gamename}
	...(import.meta.env?.VITE_ONLY_MICROGAME ?? "").trim().split("\n").map((s: string) => s.trim()),
].filter((id) => games.some((game) => getGameID(game) === id)));

if (onlyInclude.size == 0 && window.DEV_MICROGAME) {
	throw new Error(`Tried to run dev ${window.DEV_MICROGAME}, but that microgame doesn't exist!`);
}

const filteredGames = games.filter((game) => onlyInclude.has(getGameID(game)));
const pushGames = filteredGames.length ? filteredGames : games;

window.microgames.push(...pushGames);

export default window.microgames;
